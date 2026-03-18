# AI Agent Rules — Divulguei.Online

## Onboarding Protocol

Every AI agent working on this repository MUST follow these steps before making any changes:

1. **Read `ai/START.md`** — This is the bootstrap file. It explains how to load project context.
2. **Read `ai/spec/vision.md`** — Understand the project's purpose and target users.
3. **Read `ai/architecture/system_overview.md`** — Understand the architecture.
4. **Read `ai/architecture/codemap.md`** — Know where code lives.
5. **Check `ai/tasks/todo.md`** — See what tasks are pending.
6. **Check `ai/tasks/progress.md`** — See what's in progress and what's blocked.
7. **Check `ai/knowledge/problems_and_solutions.md`** — Learn from past issues.
8. **Read `ai/memory/RULES.md`** — Understand coding standards.
9. **Read `ai/memory/DECISIONS.md`** — Understand past technical decisions.

## Operational Rules

### Before Making Changes
- [ ] Read the relevant spec, architecture, and code files
- [ ] Check if the task exists in `ai/tasks/todo.md`
- [ ] Verify no blocking issues in `ai/tasks/progress.md`
- [ ] Consult `ai/knowledge/problems_and_solutions.md` for related past issues

### During Development
- [ ] Follow coding standards defined in `ai/memory/RULES.md`
- [ ] Never change core modules (auth, database config, middleware) without explicit task approval
- [ ] Never modify migration files that have already been executed
- [ ] Always use parameterized SQL queries — never string concatenation
- [ ] Test changes locally before pushing (Docker Compose)
- [ ] Keep changes scoped to the assigned task — no unrelated refactoring

### After Completing Work
- [ ] Update `ai/tasks/progress.md` with completed work
- [ ] If a new decision was made, record it in `ai/memory/DECISIONS.md`
- [ ] If a bug was fixed, document it in `ai/knowledge/problems_and_solutions.md`
- [ ] If a new pattern was established, update `ai/memory/RULES.md`
- [ ] Move completed tasks from todo.md to progress.md

### Critical Restrictions
- **NEVER** delete existing code without explicit approval
- **NEVER** modify database migrations that have been deployed
- **NEVER** hardcode credentials, API keys, or secrets in source code
- **NEVER** bypass authentication or authorization middleware
- **NEVER** use `--force` flags on git operations without approval
- **NEVER** modify docker-compose.yml volumes or networks without understanding impact
- **NEVER** change the Baileys bot connection logic without testing (risk of WhatsApp ban)

## Communication

When completing a task, provide:
1. Summary of changes made
2. Files modified
3. How to verify/test the change
4. Any follow-up tasks identified
