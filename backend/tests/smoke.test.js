const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { Duplex } = require('node:stream');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tempDbPath = path.join(
  os.tmpdir(),
  `switchgear-test-${Date.now()}.db`,
);
const tempAttachmentPath = path.join(
  os.tmpdir(),
  `switchgear-test-attachments-${Date.now()}`,
);

process.env.API_KEY = 'test-api-key';
process.env.REQUIRE_API_KEY = 'true';
process.env.DB_PATH = tempDbPath;
process.env.ATTACHMENT_STORAGE_PATH = tempAttachmentPath;

const { app } = require('../server');

const createMockRequest = ({ method, path: reqPath, body, headers }) => {
  const socket = new Duplex({
    read() {},
    write(_chunk, _encoding, callback) {
      callback();
    },
  });

  const req = new http.IncomingMessage(socket);
  req.method = method;
  req.url = reqPath;
  req.headers = headers || {};

  const res = new http.ServerResponse(req);
  res.assignSocket(socket);

  let data = '';
  const originalWrite = res.write;
  res.write = function (chunk, ...args) {
    data += chunk;
    return originalWrite.call(this, chunk, ...args);
  };
  const originalEnd = res.end;
  res.end = function (chunk, ...args) {
    if (chunk) data += chunk;
    return originalEnd.call(this, chunk, ...args);
  };

  if (body) {
    const payload = JSON.stringify(body);
    req.push(payload);
  }
  req.push(null);

  return { req, res, getBody: () => data };
};

const requestJson = ({ method, path: reqPath, body, headers }) =>
  new Promise((resolve) => {
    const finalHeaders = { ...(headers || {}) };
    if (body) {
      const payload = JSON.stringify(body);
      finalHeaders['content-type'] = 'application/json';
      finalHeaders['content-length'] = Buffer.byteLength(payload);
    }

    const { req, res, getBody } = createMockRequest({
      method,
      path: reqPath,
      body,
      headers: finalHeaders,
    });

    res.on('finish', () => {
      const raw = getBody();
      let parsed = null;
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          parsed = raw;
        }
      }
      resolve({ status: res.statusCode, body: parsed });
    });

    app.handle(req, res);
  });

const requestWithServer = async ({
  method,
  path: reqPath,
  headers,
  body,
}) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${reqPath}`, {
      method,
      headers,
      body,
    });
    const contentType = response.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.arrayBuffer();

    return { status: response.status, body: responseBody };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

const uploadFiles = ({ projectId, files }) => {
  const form = new FormData();
  files.forEach((file) => {
    form.append(
      'files',
      new Blob([file.content], { type: file.type }),
      file.name,
    );
  });

  return requestWithServer({
    method: 'POST',
    path: `/api/projects/${projectId}/attachments`,
    headers: { 'x-api-key': 'test-api-key' },
    body: form,
  });
};

after(async () => {
  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }
  if (fs.existsSync(tempAttachmentPath)) {
    fs.rmSync(tempAttachmentPath, { recursive: true, force: true });
  }
});

test('health is public', async () => {
  const res = await requestJson({
    method: 'GET',
    path: '/api/health',
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.strictEqual(res.body.db, 'sqlite');
});

test('verify-key requires api key', async () => {
  const res = await requestJson({
    method: 'GET',
    path: '/api/verify-key',
  });

  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(res.body, {
    error: 'API key is required',
    code: 'api_key_missing',
  });
});

test('verify-key rejects invalid api key with a distinct error', async () => {
  const res = await requestJson({
    method: 'GET',
    path: '/api/verify-key',
    headers: { 'x-api-key': 'wrong-key' },
  });

  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(res.body, {
    error: 'API key is invalid',
    code: 'api_key_invalid',
  });
});

test('basic project CRUD works with api key', async () => {
  const headers = { 'x-api-key': 'test-api-key' };

  const created = await requestJson({
    method: 'POST',
    path: '/api/projects',
    headers,
    body: { name: 'Test Project', client: 'Client A' },
  });

  assert.strictEqual(created.status, 200);
  assert.ok(created.body.id);

  const list = await requestJson({
    method: 'GET',
    path: '/api/projects',
    headers,
  });

  assert.strictEqual(list.status, 200);
  assert.ok(Array.isArray(list.body));

  const fetched = await requestJson({
    method: 'GET',
    path: `/api/projects/${created.body.id}`,
    headers,
  });

  assert.strictEqual(fetched.status, 200);
  assert.strictEqual(fetched.body.id, created.body.id);

  const removed = await requestJson({
    method: 'DELETE',
    path: `/api/projects/${created.body.id}`,
    headers,
  });

  assert.strictEqual(removed.status, 200);
  assert.strictEqual(removed.body.success, true);
});

test('uploads and downloads a PDF attachment', async () => {
  const headers = { 'x-api-key': 'test-api-key' };
  const created = await requestJson({
    method: 'POST',
    path: '/api/projects',
    headers,
    body: { name: 'PDF Project', client: 'Client A' },
  });

  const uploaded = await uploadFiles({
    projectId: created.body.id,
    files: [
      {
        name: 'estimate.pdf',
        type: 'application/pdf',
        content: Buffer.from('%PDF-1.4\n%%EOF\n'),
      },
    ],
  });

  assert.strictEqual(uploaded.status, 200);
  assert.strictEqual(uploaded.body.attachedFiles.length, 1);
  assert.strictEqual(uploaded.body.attachedFiles[0].name, 'estimate.pdf');
  assert.strictEqual(uploaded.body.attachedFiles[0].extension, 'pdf');

  const downloaded = await requestWithServer({
    method: 'GET',
    path: `/api/projects/${created.body.id}/attachments/${uploaded.body.attachedFiles[0].id}`,
    headers,
  });
  assert.strictEqual(downloaded.status, 200);
});

test('uploads a ZIP attachment and rejects unsupported files', async () => {
  const headers = { 'x-api-key': 'test-api-key' };
  const created = await requestJson({
    method: 'POST',
    path: '/api/projects',
    headers,
    body: { name: 'ZIP Project', client: 'Client A' },
  });

  const uploaded = await uploadFiles({
    projectId: created.body.id,
    files: [
      {
        name: 'archive.zip',
        type: 'application/zip',
        content: Buffer.from('PK\u0003\u0004'),
      },
    ],
  });

  assert.strictEqual(uploaded.status, 200);
  assert.strictEqual(uploaded.body.attachedFiles[0].extension, 'zip');

  const rejected = await uploadFiles({
    projectId: created.body.id,
    files: [
      {
        name: 'malware.exe',
        type: 'application/x-msdownload',
        content: Buffer.from('nope'),
      },
    ],
  });

  assert.strictEqual(rejected.status, 400);
  assert.strictEqual(rejected.body.error, 'Unsupported attachment type');
});

test('deletes attachment metadata and file', async () => {
  const headers = { 'x-api-key': 'test-api-key' };
  const created = await requestJson({
    method: 'POST',
    path: '/api/projects',
    headers,
    body: { name: 'Delete Attachment Project', client: 'Client A' },
  });

  const uploaded = await uploadFiles({
    projectId: created.body.id,
    files: [
      {
        name: 'delete-me.pdf',
        type: 'application/pdf',
        content: Buffer.from('%PDF-1.4\n%%EOF\n'),
      },
    ],
  });
  const attachment = uploaded.body.attachedFiles[0];

  const removed = await requestWithServer({
    method: 'DELETE',
    path: `/api/projects/${created.body.id}/attachments/${attachment.id}`,
    headers,
  });

  assert.strictEqual(removed.status, 200);
  assert.deepStrictEqual(removed.body.attachedFiles, []);

  const downloadRemoved = await requestWithServer({
    method: 'GET',
    path: `/api/projects/${created.body.id}/attachments/${attachment.id}`,
    headers,
  });
  assert.strictEqual(downloadRemoved.status, 404);
});
