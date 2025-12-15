const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

// backend/.env, 루트 .env 둘 다 시도해서 읽기 (backend/.env 우선)
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

// SQLite 초기화
const db = new Database(path.join(__dirname, 'data.db'));

// --- DB 스키마 ---
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    client TEXT,
    data TEXT,
    revisions TEXT,
    memos TEXT,
    progress TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// --- Helper Functions ---
const safeParseJson = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};

const sendError = (res, status, message) =>
  res.status(status).json({ error: message });

const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const requireJsonObjectBody = (req, res, next) => {
  if (req.body === undefined || req.body === null) {
    req.body = {};
    return next();
  }
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, 'Body must be a JSON object');
  }
  return next();
};

const validateProjectBody = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, 'Body must be a JSON object');
  }

  const {
    id,
    name,
    client,
    revisions,
    memos,
    progress,
    createdAt,
    updatedAt,
    data,
  } = req.body;

  if (id !== undefined && typeof id !== 'string') {
    return sendError(res, 400, '`id` must be a string');
  }
  if (name !== undefined && typeof name !== 'string') {
    return sendError(res, 400, '`name` must be a string');
  }
  if (client !== undefined && typeof client !== 'string') {
    return sendError(res, 400, '`client` must be a string');
  }
  if (revisions !== undefined && !Array.isArray(revisions)) {
    return sendError(res, 400, '`revisions` must be an array');
  }
  if (memos !== undefined && !Array.isArray(memos)) {
    return sendError(res, 400, '`memos` must be an array');
  }
  if (progress !== undefined && !isPlainObject(progress)) {
    return sendError(res, 400, '`progress` must be an object');
  }
  if (data !== undefined && !isPlainObject(data)) {
    return sendError(res, 400, '`data` must be an object');
  }
  if (createdAt !== undefined && typeof createdAt !== 'string') {
    return sendError(res, 400, '`createdAt` must be a string');
  }
  if (updatedAt !== undefined && typeof updatedAt !== 'string') {
    return sendError(res, 400, '`updatedAt` must be a string');
  }

  return next();
};

const requireStringField =
  (field, { allowEmpty = false } = {}) =>
  (req, res, next) => {
    if (!isPlainObject(req.body)) {
      return sendError(res, 400, 'Body must be a JSON object');
    }

    const value = req.body[field];
    if (typeof value !== 'string') {
      return sendError(res, 400, `\`${field}\` must be a string`);
    }
    if (!allowEmpty && value.trim().length === 0) {
      return sendError(res, 400, `\`${field}\` is required`);
    }
    return next();
  };

const validateMemoBody = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return sendError(res, 400, 'Body must be a JSON object');
  }

  const { title, content } = req.body;
  if (title !== undefined && typeof title !== 'string') {
    return sendError(res, 400, '`title` must be a string');
  }
  if (content !== undefined && typeof content !== 'string') {
    return sendError(res, 400, '`content` must be a string');
  }

  return next();
};

const validateBackupRestoreBody = (req, res, next) => {
  const projects = req.body;
  if (!Array.isArray(projects)) {
    return sendError(res, 400, 'Invalid backup data');
  }
  if (!projects.every((p) => isPlainObject(p))) {
    return sendError(res, 400, 'Invalid backup data');
  }
  return next();
};

// DB Row -> 프론트에서 쓰는 프로젝트 형태
const mapRowToProject = (row) => {
  const data = safeParseJson(row.data, {});
  const revisions = safeParseJson(row.revisions, []);
  const memos = safeParseJson(row.memos, []);
  const progress = safeParseJson(row.progress, {});

  return {
    // 커스텀 필드(ledgerName, status, contractAmount 등)는 data 안에 저장되어 있음
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

// 프론트 프로젝트 객체 -> DB 컬럼 세트
const buildDbFieldsFromProject = (project) => {
  const {
    id,
    name,
    client,
    revisions = [],
    memos = [],
    progress = {},
    createdAt,
    updatedAt,
    data,
    ...rest
  } = project || {};

  const nowIso = new Date().toISOString();

  // 기존 data 안에 들어있던 값과 나머지 필드를 모두 병합
  const mergedData =
    data && typeof data === 'object'
      ? { ...data, ...rest }
      : { ...rest };

  return {
    id: id || Date.now().toString(),
    name: name || '',
    client: client || '',
    data: JSON.stringify(mergedData),
    revisions: JSON.stringify(revisions),
    memos: JSON.stringify(memos),
    progress: JSON.stringify(progress),
    createdAt: createdAt || nowIso,
    updatedAt: updatedAt || nowIso,
  };
};

// --- Express 앱 설정 ---
const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY =
  process.env.API_KEY || process.env.ESTIMATE_TOOL_API_KEY || null;

app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.json());

// --- 기본 페이지 ---
app.get('/', (req, res) => {
  res.send(
    '스위치기어 견적관리 백엔드 서버가 정상 동작 중입니다.',
  );
});

app.get('/estimate', (req, res) => {
  res.send(
    '스위치기어 견적관리 백엔드 서버가 정상 동작 중입니다. (/estimate 경로)',
  );
});

// 1. Health Check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', db: 'sqlite' }),
);

// API Key 미들웨어 (health 제외)
app.use((req, res, next) => {
  if (!API_KEY) return next();

  const headerKey = req.headers['x-api-key'];
  if (headerKey && headerKey === API_KEY) {
    return next();
  }

  return sendError(res, 401, 'Unauthorized');
});

// 2. API Key Verification
app.get('/api/verify-key', (req, res) =>
  res.json({ valid: true }),
);

// 3. 프로젝트 목록 조회
app.get('/api/projects', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects');
  const rows = stmt.all();
  const projects = rows.map(mapRowToProject);
  res.json(projects);
});

// 4. 프로젝트 생성
app.post(
  '/api/projects',
  requireJsonObjectBody,
  validateProjectBody,
  (req, res) => {
  const dbProject = buildDbFieldsFromProject(req.body || {});

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, client, data, revisions, memos, progress, createdAt, updatedAt)
    VALUES (@id, @name, @client, @data, @revisions, @memos, @progress, @createdAt, @updatedAt)
  `);

  stmt.run(dbProject);

  res.json({ success: true, id: dbProject.id });
},
);

// 5. 프로젝트 상세 조회
app.get('/api/projects/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = stmt.get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: 'Not found' });
  }

  const project = mapRowToProject(row);
  res.json(project);
});

// 6. 프로젝트 수정
app.put(
  '/api/projects/:id',
  requireJsonObjectBody,
  validateProjectBody,
  (req, res) => {
  const selectStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = selectStmt.get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: 'Not found' });
  }

  const existing = mapRowToProject(row);
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  const dbProject = buildDbFieldsFromProject(updated);

  const updateStmt = db.prepare(`
    UPDATE projects
    SET name = @name,
        client = @client,
        data = @data,
        revisions = @revisions,
        memos = @memos,
        progress = @progress,
        createdAt = @createdAt,
        updatedAt = @updatedAt
    WHERE id = @id
  `);

  updateStmt.run(dbProject);
  res.json({ success: true });
},
);

// 7. 프로젝트 삭제
app.delete('/api/projects/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// --- 리비전 API ---

// 8. 리비전 추가
app.post('/api/projects/:id/revisions', requireJsonObjectBody, (req, res) => {
  const stmt = db.prepare('SELECT revisions FROM projects WHERE id = ?');
  const row = stmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const revisions = safeParseJson(row.revisions, []);
  const newRevision = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  revisions.push(newRevision);

  const updateStmt = db.prepare(
    'UPDATE projects SET revisions = ?, updatedAt = ? WHERE id = ?',
  );
  updateStmt.run(
    JSON.stringify(revisions),
    new Date().toISOString(),
    req.params.id,
  );
  res.json(newRevision);
});

// 9. 리비전 수정
app.put(
  '/api/projects/:projectId/revisions/:revisionId',
  requireJsonObjectBody,
  (req, res) => {
    const stmt = db.prepare(
      'SELECT revisions FROM projects WHERE id = ?',
    );
    const row = stmt.get(req.params.projectId);
    if (!row) return res.status(404).json({ error: 'Not found' });

    let revisions = safeParseJson(row.revisions, []);
    revisions = revisions.map((r) =>
      r.id === req.params.revisionId ? { ...r, ...req.body } : r,
    );

    const updateStmt = db.prepare(
      'UPDATE projects SET revisions = ?, updatedAt = ? WHERE id = ?',
    );
    updateStmt.run(
      JSON.stringify(revisions),
      new Date().toISOString(),
      req.params.projectId,
    );
    res.json({ success: true });
  },
);

// 17. 리비전 삭제
app.delete(
  '/api/projects/:projectId/revisions/:revisionId',
  (req, res) => {
    const stmt = db.prepare('SELECT revisions FROM projects WHERE id = ?');
    const row = stmt.get(req.params.projectId);
    if (!row) return res.status(404).json({ error: 'Not found' });

    let revisions = safeParseJson(row.revisions, []);
    revisions = revisions.filter((r) => r.id !== req.params.revisionId);

    const updateStmt = db.prepare(
      'UPDATE projects SET revisions = ?, updatedAt = ? WHERE id = ?',
    );
    updateStmt.run(
      JSON.stringify(revisions),
      new Date().toISOString(),
      req.params.projectId,
    );
    res.json({ success: true });
  },
);

// --- 상태/진행 API ---

// 10. 상태 업데이트
app.put(
  '/api/projects/:id/status',
  requireJsonObjectBody,
  requireStringField('status', { allowEmpty: true }),
  (req, res) => {
  const stmt = db.prepare('SELECT data FROM projects WHERE id = ?');
  const row = stmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const data = safeParseJson(row.data, {});
  data.status = req.body.status;

  const updateStmt = db.prepare(
    'UPDATE projects SET data = ?, updatedAt = ? WHERE id = ?',
  );
  updateStmt.run(
    JSON.stringify(data),
    new Date().toISOString(),
    req.params.id,
  );

  // 업데이트된 status 반환
  res.json({ success: true, status: data.status });
},
);

// 11. 진행 단계 업데이트 (토글 방식)
app.put(
  '/api/projects/:id/progress',
  requireJsonObjectBody,
  requireStringField('stage'),
  (req, res) => {
  const stmt = db.prepare(
    'SELECT progress FROM projects WHERE id = ?',
  );
  const row = stmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const progress = safeParseJson(row.progress, {});
  const stage = req.body.stage;

  // 토글: 이미 있으면 해제, 없으면 설정
  if (progress[stage]) {
    delete progress[stage];
  } else {
    progress[stage] = new Date().toISOString();
  }

  const updateStmt = db.prepare(
    'UPDATE projects SET progress = ?, updatedAt = ? WHERE id = ?',
  );
  updateStmt.run(
    JSON.stringify(progress),
    new Date().toISOString(),
    req.params.id,
  );

  // 업데이트된 progress 반환
  res.json({ success: true, progress });
},
);

// --- 메모 API ---

// 12. 메모 생성
app.post(
  '/api/projects/:id/memos',
  requireJsonObjectBody,
  validateMemoBody,
  (req, res) => {
  const stmt = db.prepare('SELECT memos FROM projects WHERE id = ?');
  const row = stmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const memos = safeParseJson(row.memos, []);
  const newMemo = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  memos.push(newMemo);

  const updateStmt = db.prepare(
    'UPDATE projects SET memos = ?, updatedAt = ? WHERE id = ?',
  );
  updateStmt.run(
    JSON.stringify(memos),
    new Date().toISOString(),
    req.params.id,
  );
  res.json(newMemo);
},
);

// 13. 메모 수정
app.put(
  '/api/projects/:projectId/memos/:memoId',
  requireJsonObjectBody,
  validateMemoBody,
  (req, res) => {
    const stmt = db.prepare('SELECT memos FROM projects WHERE id = ?');
    const row = stmt.get(req.params.projectId);
    if (!row) return res.status(404).json({ error: 'Not found' });

    let memos = safeParseJson(row.memos, []);
    memos = memos.map((m) =>
      m.id === req.params.memoId ? { ...m, ...req.body } : m,
    );

    const updateStmt = db.prepare(
      'UPDATE projects SET memos = ?, updatedAt = ? WHERE id = ?',
    );
    updateStmt.run(
      JSON.stringify(memos),
      new Date().toISOString(),
      req.params.projectId,
    );
    res.json({ success: true });
  },
);

// 14. 메모 삭제
app.delete(
  '/api/projects/:projectId/memos/:memoId',
  (req, res) => {
    const stmt = db.prepare('SELECT memos FROM projects WHERE id = ?');
    const row = stmt.get(req.params.projectId);
    if (!row) return res.status(404).json({ error: 'Not found' });

    let memos = safeParseJson(row.memos, []);
    memos = memos.filter((m) => m.id !== req.params.memoId);

    const updateStmt = db.prepare(
      'UPDATE projects SET memos = ?, updatedAt = ? WHERE id = ?',
    );
    updateStmt.run(
      JSON.stringify(memos),
      new Date().toISOString(),
      req.params.projectId,
    );
    res.json({ success: true });
  },
);

// --- 백업 API ---

// 15. 백업 다운로드
app.get('/api/backup/projects', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects');
  const rows = stmt.all();
  const projects = rows.map(mapRowToProject);
  res.json(projects);
});

// 16. 백업 복원
app.post('/api/backup/projects', validateBackupRestoreBody, (req, res) => {
  const projects = req.body;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO projects (id, name, client, data, revisions, memos, progress, createdAt, updatedAt)
    VALUES (@id, @name, @client, @data, @revisions, @memos, @progress, @createdAt, @updatedAt)
  `);

  const insertMany = db.transaction((items) => {
    items.forEach((p) => {
      const dbProject = buildDbFieldsFromProject(p);
      insertStmt.run(dbProject);
    });
  });

  insertMany(projects);
  res.json({ success: true, count: projects.length });
});

app.use((req, res) => sendError(res, 404, 'Not found'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err && err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Malformed JSON');
  }

  console.error(err);
  return sendError(res, 500, 'Internal server error');
});

// --- 서버 실행 ---
app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start backend server:', err);
    process.exit(1);
  }
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Database: SQLite (data.db)');
});
