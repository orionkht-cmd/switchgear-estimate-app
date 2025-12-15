# Switchgear Estimate App

React (frontend) + Express (backend) + SQLite (local DB) for switchgear estimate/project management.

## Getting Started

### Prerequisites
- Node.js LTS (recommended)
- npm

### Install
Frontend (from repo root):
```bash
npm install
```

Backend (from repo root):
```bash
npm --prefix backend install
```

### Configure
Backend:
- Copy `backend/.env.example` → `backend/.env` and fill in values.
- Optional: set `API_KEY` (or `ESTIMATE_TOOL_API_KEY`) to require `x-api-key` on requests.

Frontend:
- Optional: set `REACT_APP_API_BASE_URL` to point to your backend (example: `http://localhost:4000`).
- API key (if enabled on backend): store it in browser localStorage under `apiKey` (sent as `x-api-key`).

Security:
- Never commit real secrets (passwords, API keys) into `.env` files.

### Run (local)
Terminal 1 (backend):
```bash
npm run start:backend
```

Terminal 2 (frontend):
```bash
npm start
```

Default URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000` (see `backend/.env`)

### Backup Email (optional)
The backend includes `backend/send-db-email.js` to email `backend/data.db` (and an Excel export) via SMTP.
```bash
npm --prefix backend run send-db-email
```

## Deployment

### Build
```bash
npm run build
```

Build artifacts are generated in `build/`.

### Vercel (optional)
```bash
npx vercel
npx vercel --prod
```

---

## Korean Guide (legacy)
The following is kept for existing users; the sections above are the recommended setup.

### 0. 준비물 (필수)
- ZIP 파일이면 반드시 **모두 압축 풀기**
- Google 계정(지메일) 준비

### 1. Node.js 설치
- https://nodejs.org 접속 → **LTS** 다운로드/설치

### 2. 터미널 열기(Windows)
- 폴더 주소창 클릭 → `cmd` 입력 → Enter

### 3. 최초 1회 설치
```bash
npm install
```

### 4. 실행
```bash
npm start
```

### 5. Vercel 배포
```bash
npx vercel
```

수정 반영:
```bash
npx vercel --prod
```

