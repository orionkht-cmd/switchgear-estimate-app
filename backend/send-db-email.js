const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

let Database;
let XLSX;

try {
  // SQLite 읽기용
  Database = require('better-sqlite3');
} catch (e) {
  console.error(
    '[send-db-email] better-sqlite3 모듈을 찾을 수 없습니다. backend 폴더에서 "npm install"을 실행해 주세요.',
  );
  process.exit(1);
}

try {
  // 엑셀 생성용
  XLSX = require('xlsx');
} catch (e) {
  console.error(
    '[send-db-email] xlsx 모듈을 찾을 수 없습니다. backend 폴더에서 "npm install xlsx"를 실행해 주세요.',
  );
  process.exit(1);
}

// backend/.env, 루트 .env 둘 다 시도해서 읽기
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

const safeParseJson = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};

const mapRowToProject = (row) => {
  const data = safeParseJson(row.data, {});
  const revisions = safeParseJson(row.revisions, []);
  const memos = safeParseJson(row.memos, []);
  const progress = safeParseJson(row.progress, {});

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || '',
    client: row.client || data.client || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    revisions,
    memos,
    progress,
  };
};

const createExcelBackupFromDb = (dbPath, dateStr) => {
  const db = new Database(dbPath, { readonly: true });

  try {
    const stmt = db.prepare('SELECT * FROM projects');
    const rows = stmt.all();

    const projects = rows.map(mapRowToProject);

    const workbook = XLSX.utils.book_new();

    const sheetData = projects.map((p) => ({
      상태: p.status || '',
      프로젝트명: p.name || '',
      발주처: p.client || '',
      소속대장: p.ledgerName || '',
      영업담당: p.salesRep || '',
      설계담당: p.manager || '',
      계약금액: p.contractAmount || 0,
      최종실행원가: p.finalCost || 0,
      생성일: p.createdAt ? String(p.createdAt).slice(0, 10) : '',
      최근수정: p.updatedAt ? String(p.updatedAt).slice(0, 10) : '',
    }));
    const worksheet =
      sheetData.length > 0
        ? XLSX.utils.json_to_sheet(sheetData)
        : XLSX.utils.aoa_to_sheet([
            [
              '상태',
              '프로젝트명',
              '발주처',
              '소속대장',
              '영업담당',
              '설계담당',
              '계약금액',
              '최종실행원가',
              '생성일',
              '최근수정',
            ],
          ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로젝트목록');

    const excelFilename = `프로젝트목록_${dateStr}.xlsx`;
    const excelPath = path.join(__dirname, excelFilename);

    XLSX.writeFile(workbook, excelPath);

    return excelPath;
  } finally {
    db.close();
  }
};

async function main() {
  const dbPath = path.join(__dirname, 'data.db');

  if (!fs.existsSync(dbPath)) {
    console.error('[send-db-email] data.db 파일을 찾을 수 없습니다:', dbPath);
    process.exit(1);
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
    MAIL_TO,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
    console.error(
      '[send-db-email] .env에 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO를 모두 설정해 주세요.',
    );
    process.exit(1);
  }

  const port = Number(SMTP_PORT) || 587;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465면 TLS, 그 외에는 STARTTLS
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  let excelPath = null;
  try {
    excelPath = createExcelBackupFromDb(dbPath, dateStr);
    console.log(
      '[send-db-email] 엑셀 백업 생성 완료:',
      path.basename(excelPath),
    );
  } catch (e) {
    console.error(
      '[send-db-email] 엑셀 백업 생성 중 오류가 발생했지만 메일 전송은 계속합니다:',
      e,
    );
  }

  const attachments = [
    {
      filename: `data-${dateStr}.db`,
      path: dbPath,
    },
  ];

  if (excelPath && fs.existsSync(excelPath)) {
    attachments.push({
      filename: path.basename(excelPath),
      path: excelPath,
    });
  }

  const mailOptions = {
    from: MAIL_FROM,
    to: MAIL_TO,
    subject: `[Switchgear] 주간 DB 백업 (${dateStr})`,
    text:
      '스위치기어 견적관리 툴의 주간 DB 백업 파일입니다.\n\n' +
      `보낸 시각: ${now.toISOString()}\n` +
      '첨부된 data.db 파일과 프로젝트목록 엑셀 파일을 안전한 곳에 보관해 주세요.\n',
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[send-db-email] 메일 전송 성공:', info.messageId);
  } catch (err) {
    console.error('[send-db-email] 메일 전송 실패:', err);
    process.exit(1);
  }
}

main();
