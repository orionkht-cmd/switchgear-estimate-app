# AI Agent Improvement Prompts

## Execution Rules
- All responses must be actionable file edits; do not provide only explanations.
- Always modify project files using file-edit tools (`replace_string_in_file`, `create_file`, `apply_patch`).
- Execute prompts sequentially from top to bottom. After finishing one prompt, proceed to the next.
- Each prompt must include target files, concrete implementation steps, and verification commands.
- Do not reference past sessions or completed items. Only operate on pending items listed below.

---

## Execution Checklist

| # | Prompt ID | Title | Priority | Status |
|:---|:---:|:---|:---:|:---:|
| 1 | PROMPT-001 | Expand core command tests (`test-commands-001`) | P1 | ⬜ Pending |
| 2 | PROMPT-002 | Improve docs and deployment guide (`docs-deploy-001`) | P2 | ⬜ Pending |
| 3 | PROMPT-003 | Backend input validation & security (`security-backend-001`) | P2 | ⬜ Pending |
| 4 | PROMPT-004 | AI integration for estimate suggestions (`feat-ai-integration-001`) | P3 | ⬜ Pending |
| 5 | PROMPT-005 | Multi-workspace support (`feat-multiworkspace-001`) | P3 | ⬜ Pending |
| 6 | OPT-001 | Code optimization and caching (`opt-code-001`) | OPT | ⬜ Pending |

Total: 6 prompts | Completed: 0 | Remaining: 6

---

## Priority Group: P1

### [PROMPT-001] Expand core command tests (`test-commands-001`)
Execute this prompt now, then proceed to PROMPT-002.

Task description:
- Add unit and integration tests for the project's core flows: project create, project edit, revision save, and estimate calculation.

Target files and paths:
- `src/components/ProjectFormModal.js` (or `.jsx`) and related form components
- `src/services/projects.js`
- `src/services/projectDetailService.js`
- Add tests under `__tests__/` or `src/__tests__/` (create folder if missing)

Steps:
1. Create a test setup using Jest and React Testing Library patterns. Add test files `src/__tests__/project-flows.test.js`.
2. Write isolated unit tests for `projects.js` functions that compute costs or manipulate project objects.
3. Implement React Testing Library integration tests that mount `ProjectFormModal` and simulate user flows: fill inputs, submit, and assert expected service calls or resulting UI.
4. Add minimal mocks for network calls (mock `fetch` or `apiClient`) to keep tests fast and deterministic.
5. Ensure tests run with `npm test` and update `package.json` if any helper scripts are needed.

Implementation requirement:
- Write actual test code (JavaScript) in the target test files. Do not leave placeholders.

Verification:
- Run `npm test -- --watchAll=false` or `npm run test` and confirm tests execute and pass locally.
- Ensure new tests are included in CI test run (if CI exists).

After completing this prompt, proceed to PROMPT-002.

---

## Priority Group: P2

### [PROMPT-002] Improve docs and deployment guide (`docs-deploy-001`)
Execute this prompt now, then proceed to PROMPT-003.

Task description:
- Create or update deployment and onboarding documentation, add `.env.example`, and provide simple build/run commands.

Target files and paths:
- `README.md`
- `backend/.env` -> create `backend/.env.example`
- `package.json` (scripts section)
- `devplan/Prompt.md` (this file) should remain English-only

Steps:
1. Replace or append a "Deployment" section in `README.md` with exact commands to build and run locally: `npm install`, `npm run build`, `npm start`.
2. Add `backend/.env.example` with the minimal keys used by `backend/server.js` (for example: `PORT`, `DB_PATH`, `EMAIL_HOST`) — inspect `backend/server.js` to determine keys and include safe placeholders.
3. Add a short "Testing" subsection with `npm run test` instructions and any environment variables required for tests.
4. Add a simple `scripts` helper if helpful (e.g., `npm run start:backend`) by editing `package.json`.

Implementation requirement:
- Write concrete README content and a valid `backend/.env.example` file populated with placeholder values.

Verification:
- Confirm `README.md` includes the new sections and `backend/.env.example` exists.
- Run `npm run build` and ensure build completes without modifying production code.

After completing this prompt, proceed to PROMPT-003.

### [PROMPT-003] Backend input validation & security (`security-backend-001`)
Execute this prompt now, then proceed to PROMPT-004.

Task description:
- Harden basic input validation in the backend and standardize error responses.

Target files and paths:
- `backend/server.js`
- `src/services/apiClient.js`

Steps:
1. Inspect `backend/server.js` for routes that accept user input. Add validation logic using a small schema check (e.g., AJV or manual checks). If AJV is present in devDependencies, prefer AJV; otherwise implement simple checks.
2. Standardize error response format: `{ success: false, error: { code: 'INVALID_INPUT', message: '...' } }`.
3. Ensure the backend does not log or expose sensitive environment variables in errors.
4. Add unit tests that send invalid payloads and assert the standardized error responses (place tests under `src/__tests__/backend-validation.test.js` or similar).

Implementation requirement:
- Modify `backend/server.js` to implement validation and error formatting. Add tests that verify behavior.

Verification:
- Run `node backend/server.js` (or use `npm start` if configured) and exercise endpoints with invalid payloads to confirm standardized error responses.
- Run the test suite `npm test` and ensure new tests pass.

After completing this prompt, proceed to PROMPT-004.

---

## Priority Group: P3

### [PROMPT-004] AI integration for estimate suggestions (`feat-ai-integration-001`)
Execute this prompt now, then proceed to PROMPT-005.

Task description:
- Add a service-layer integration point to provide estimate suggestion data based on project inputs. Provide a minimal local mock implementation and a configurable remote connector.

Target files and paths:
- `src/services/projectDetailService.js`
- `src/components/ProjectFormModal.js`
- Add `src/services/aiService.js` (new)

Steps:
1. Create `src/services/aiService.js` exporting `getEstimateSuggestions(input)` that returns a Promise resolving to suggestion objects. Implement a safe local fallback algorithm (rule-based) and a placeholder for remote LLM call (configurable via env).
2. In `ProjectFormModal.js`, call `getEstimateSuggestions` when inputs reach a valid state and render suggestions in the UI.
3. Expose configuration via environment flag (e.g., `REACT_APP_AI_ENABLED`) so remote calls are opt-in.
4. Add basic unit tests mocking `aiService`.

Implementation requirement:
- Provide working local suggestion logic and UI to show at least one suggested option. Do not hard-code sensitive keys.

Verification:
- Run the app (`npm start`) and exercise the Project Form to observe suggestions appear when inputs are provided.
- Run `npm test` to verify tests for `aiService`.

After completing this prompt, proceed to PROMPT-005.

### [PROMPT-005] Multi-workspace support (`feat-multiworkspace-001`)
Execute this prompt now, then proceed to OPT-001.

Task description:
- Add a lightweight workspace grouping feature so projects can be filtered and grouped by `workspaceId`.

Target files and paths:
- `src/services/projects.js`
- `src/ProjectListView.js` or `src/components/ProjectListView.js`
- `src/ProjectSidebar.js`

Steps:
1. Extend project objects to accept `workspaceId` optional property; update creation flow to allow setting it.
2. Add UI controls in `ProjectSidebar` to select or filter by workspace.
3. Update `projects.js` to provide filtered query helpers and ensure persistence (local storage or existing backend).
4. Add unit tests for filtering logic.

Implementation requirement:
- Implement code that updates project data model, UI filter controls, and test coverage for filtering.

Verification:
- Run the app and confirm workspace filter changes the displayed project list.
- Run `npm test` to confirm tests.

---

## Optimization Group (OPT)

### [OPT-001] Code optimization and caching (`opt-code-001`)
Execute this prompt now, then proceed to final verification.

Task description:
- Refactor `apiClient` to centralize HTTP logic and add a simple in-memory cache for GET requests. Simplify `useProjectDetail` to avoid duplicate calls.

Target files and paths:
- `src/services/apiClient.js`
- `src/hooks/useProjectDetail.js`
- `src/services/projects.js`

Steps:
1. Modify or create `src/services/apiClient.js` to export `get`, `post`, `put`, `delete` methods and add a small LRU or TTL in-memory cache for GET.
2. Replace direct fetch usage in services with `apiClient.get/post` helpers.
3. Update `useProjectDetail` to use a single cached fetch and expose `loading/error/data` state cleanly.
4. Add unit tests that verify cache behavior and that duplicate calls are avoided.

Implementation requirement:
- Provide fully implemented helper methods; do not leave placeholders.

Verification:
- Use React DevTools or logs to confirm duplicate API calls are reduced.
- Run `npm test` and ensure new tests pass.

After completing all prompts, run final verification commands:

```bash
npm run build
npm test -- --watchAll=false
```

Final step:
- Print `ALL PROMPTS COMPLETED. All pending improvement and optimization items from the latest report have been applied.`

---

ALL PROMPTS MUST BE EXECUTED SEQUENTIALLY. DO NOT SKIP PROMPTS.
