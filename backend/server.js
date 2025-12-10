const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
require('dotenv').config();

// SQLite 초기화
const db = new Database('data.db');

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

  return res.status(401).json({ error: 'Unauthorized' });
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
app.post('/api/projects', (req, res) => {
  const dbProject = buildDbFieldsFromProject(req.body || {});

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, client, data, revisions, memos, progress, createdAt, updatedAt)
    VALUES (@id, @name, @client, @data, @revisions, @memos, @progress, @createdAt, @updatedAt)
  `);

  stmt.run(dbProject);

  res.json({ success: true, id: dbProject.id });
});

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
app.put('/api/projects/:id', (req, res) => {
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
});

// 7. 프로젝트 삭제
app.delete('/api/projects/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// --- 리비전 API ---

// 8. 리비전 추가
app.post('/api/projects/:id/revisions', (req, res) => {
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
app.put('/api/projects/:id/status', (req, res) => {
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
});

// 11. 진행 단계 업데이트 (토글 방식)
app.put('/api/projects/:id/progress', (req, res) => {
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
});

// --- 메모 API ---

// 12. 메모 생성
app.post('/api/projects/:id/memos', (req, res) => {
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
});

// 13. 메모 수정
app.put(
  '/api/projects/:projectId/memos/:memoId',
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
app.post('/api/backup/projects', (req, res) => {
  const projects = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Invalid backup data' });
  }

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

// --- 서버 실행 ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Database: SQLite (data.db)');
});
