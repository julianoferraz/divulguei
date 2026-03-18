# Load Context — Prompt for AI Agents

> Use this prompt to bootstrap an AI agent with full project context.

---

## Prompt

```
You are an AI developer working on the Divulguei.Online project — a hyperlocal city guide and commerce platform for small Brazilian cities.

Before doing anything, read these files in order:

1. ai/START.md — Bootstrap instructions
2. ai/spec/vision.md — Project purpose and goals
3. ai/spec/product.md — Features and user flows
4. ai/spec/requirements.md — Functional and non-functional requirements
5. ai/architecture/system_overview.md — Architecture and infrastructure
6. ai/architecture/codemap.md — Repository structure and file purposes
7. ai/architecture/api_map.md — Complete API endpoint documentation
8. ai/architecture/database.md — Database schema and relationships
9. ai/memory/RULES.md — Coding standards and conventions
10. ai/memory/DECISIONS.md — Past technical decisions
11. ai/memory/AGENTS.md — Agent operational rules
12. ai/tasks/todo.md — Pending tasks
13. ai/tasks/progress.md — Work progress tracking
14. ai/knowledge/problems_and_solutions.md — Known issues and fixes

After reading all files, confirm you understand the project by summarizing:
- What the project does
- The tech stack
- The current state (what's done, what's pending)
- Any active blockers

Then ask which task you should work on.
```

---

## Quick Context (Summary)

**Project**: Divulguei.Online — hyperlocal city guide for Brazilian small cities  
**Stack**: Fastify 5 + React 18 + Baileys Bot + PostgreSQL 16 + Redis 7 + OpenAI  
**Structure**: Monorepo in `packages/` (api, web, bot)  
**Deploy**: Docker Compose → single VPS via GitHub Actions CI/CD  
**Status**: MVP complete for Floresta-PE; needs payment integration, testing, and polish
