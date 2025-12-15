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
- `src/components/ProjectFormModal.js`
- `src/services/projects.js`
- `src/services/projectDetailService.js`
- `src/__tests__/project-flows.test.js` (create new)

Steps:
1. Create a test setup using Jest and React Testing Library. Create `src/__tests__/project-flows.test.js`.
2. Write isolated unit tests for `projects.js` functions that compute costs.
3. Implement integration tests that mount `ProjectFormModal`, simulate user input (e.g., project name, selecting items), and assert that the correct service functions are called.
4. Mock network calls to keep tests deterministic.
5. Ensure `npm test` runs these tests.

Implementation requirement:
- Write actual functional test code. Do not use placeholders like `// implementation needed`.

Verification:
- Run `npm test` and confirm `project-flows.test.js` passes.

After completing this prompt, proceed to PROMPT-002.

---

## Priority Group: P2

### [PROMPT-002] Improve docs and deployment guide (`docs-deploy-001`)
Execute this prompt now, then proceed to PROMPT-003.

Task description:
- Update `README.md` with clear build/run instructions and create `backend/.env.example`.

Target files and paths:
- `README.md`
- `backend/.env.example` (create new)
- `package.json`

Steps:
1. Update `README.md` to include a "Getting Started" section (prerequisites, install, run) and a "Deployment" section (build command, artifacts).
2. Create `backend/.env.example` listing all required environment variables (e.g., PORT, DB_URI) with placeholder values.
3. Review `package.json` scripts and add a `start:backend` script if missing.

Implementation requirement:
- Provide clear, professional English documentation.

Verification:
- Verify `backend/.env.example` exists.
- Run `npm run build` to ensure the build process is valid as described.

After completing this prompt, proceed to PROMPT-003.

### [PROMPT-003] Backend input validation & security (`security-backend-001`)
Execute this prompt now, then proceed to PROMPT-004.

Task description:
- Add input validation middleware to `backend/server.js` and standardize error responses.

Target files and paths:
- `backend/server.js`
- `src/services/apiClient.js`

Steps:
1. Identify POST/PUT endpoints in `backend/server.js`.
2. Add validation logic (check for required fields, type checks) before processing data.
3. Standardize error responses to JSON format: `{ "error": "message" }`.
4. Update `apiClient.js` to handle these standard error responses gracefully.

Implementation requirement:
- Do not introduce heavy validation libraries unless already present; simple checks are sufficient for now.

Verification:
- Send a malformed request (e.g., via Curl or a test script) and verify the server returns a 400 status with a JSON error message.

After completing this prompt, proceed to PROMPT-004.

---

## Priority Group: P3

### [PROMPT-004] AI integration for estimate suggestions (`feat-ai-integration-001`)
Execute this prompt now, then proceed to PROMPT-005.

Task description:
- Add a new "AI Recommendation" feature to the Project Form.

Target files and paths:
- `src/services/aiService.js` (create new)
- `src/components/ProjectFormModal.js`

Steps:
1. Create `src/services/aiService.js`. Implement a function `getEstimateSuggestions(specs)` that returns mock data (or calls OpenAI if API key exists).
2. In `ProjectFormModal.js`, add a "Get Suggestions" button next to key input fields.
3. On click, call the service and populate/update form fields with suggested values.

Implementation requirement:
- Ensure the Mock fallback is robust so the feature works without an API key.

Verification:
- Open the form, click "Get Suggestions", and verify fields are populated.

After completing this prompt, proceed to PROMPT-005.

### [PROMPT-005] Multi-workspace support (`feat-multiworkspace-001`)
Execute this prompt now, then proceed to OPT-001.

Task description:
- Add workspace filtering to the Project Sidebar.

Target files and paths:
- `src/components/ProjectSidebar.js`
- `src/services/projects.js`

Steps:
1. Update `projects.js` to support a `workspaceId` property in the project data model.
2. In `ProjectSidebar.js`, add a dropdown or list to select a Workspace.
3. Filter the displayed project list based on the selected workspace.

Implementation requirement:
- Default to a "Personal" workspace if undefined.

Verification:
- Create projects with different workspace IDs (manually or via code) and verify filtering works.

After completing this prompt, proceed to OPT-001.

---

## Optimization Group (OPT)

### [OPT-001] Code optimization and caching (`opt-code-001`)
Execute this prompt now, then proceed to final verification.

Task description:
- Optimize `apiClient` with caching and refactor `useProjectDetail` to reduce re-renders.

Target files and paths:
- `src/services/apiClient.js`
- `src/hooks/useProjectDetail.js`

Steps:
1. Modify `apiClient.js` to implement a singleton pattern with a simple in-memory cache for GET requests.
2. Refactor `useProjectDetail.js` to reuse this cache and handle loading states more cleanly (avoiding waterfall requests).
3. Add JSDoc type hints to these files to improve developer experience (IntelliSense).

Implementation requirement:
- Show tangible code structure improvements.

Verification:
- Check React DevTools or console logs to confirm fewer network requests are made when revisiting a project detail.

---

## Final Verification
After completing all prompts, run the following commands to ensure system health:

```bash
npm run build
npm test
```

If all tests pass and the build succeeds, execute the following:

**COMPLETION MESSAGE:**
"ALL PROMPTS COMPLETED. All pending improvement and optimization items from the latest report have been applied."

