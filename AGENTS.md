# CardBot project handoff rules

- Read `docs/STATUS.md`, `docs/HANDOFF.md` and the current user request before changes. Preserve unrelated work.
- `/` is the isolated fictional preview. `/crm.html` is the authenticated legacy CRM. Do not silently merge preview storage with real business data or bypass authentication.
- Keep the project name CardBot throughout original application code/UI. Preserve legally required third-party notices.
- Follow the same-batch workday and evidence-first draft requirements in `docs/COMPETITION.md`.
- Never equate Mock/local save with verified OKKI save, or a draft with a sent quotation.
- Do not commit credentials, private customer records, database dumps, browser sessions, or local account notes.
- User has selected DeepSeek but has not requested paid model calls yet. Real OKKI integration requires authorized account and verified documentation.
- For frontend changes, maintain `FRONTEND_DESIGN_SPEC.md`, run the relevant tests and inspect desktop/mobile output.
- Core verification: `npm run test:core`; frontend build: `npm run build --workspace frontend`. Browser verification instructions are in `docs/RUNBOOK.md`.
- Each delivery must update current status, test results, unverified work and next steps. Do not let historical documents overrule current decisions.
- No force push, destructive database initialization, automatic external messages or production writes without explicit task-specific authority.
