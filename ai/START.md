# START — Divulguei.Online AI Development Bootstrap

> **READ THIS FILE FIRST** before making any changes to this repository.

---

## What is this project?

**Divulguei.Online** is a hyperlocal digital city guide and commerce platform for small Brazilian cities. It includes a business directory, classified ads marketplace, professional services directory, job board, events calendar, news aggregation, public services directory, and a WhatsApp bot — all powered by AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Fastify 5 + TypeScript |
| Frontend | React 18 + Vite 6 + Tailwind CSS |
| WhatsApp Bot | Baileys 6 + OpenAI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | OpenAI (GPT-4.1-mini, GPT-4o, Whisper) |
| Deploy | Docker Compose + GitHub Actions |

## Repository Structure

```
packages/api/     → REST API (Fastify)
packages/web/     → Frontend SPA (React)
packages/bot/     → WhatsApp Bot (Baileys)
ai/               → AI development layer (you are here)
```

---

## Required Reading Order

Before starting any task, read these files in order:

### 1. Understand the Product
- [`ai/spec/vision.md`](spec/vision.md) — Project goal, target users, value proposition
- [`ai/spec/product.md`](spec/product.md) — Features, user flows, major components
- [`ai/spec/requirements.md`](spec/requirements.md) — Functional and non-functional requirements
- [`ai/spec/plan.md`](spec/plan.md) — Implementation strategy and roadmap

### 2. Understand the Architecture
- [`ai/architecture/system_overview.md`](architecture/system_overview.md) — Services, dependencies, infrastructure
- [`ai/architecture/codemap.md`](architecture/codemap.md) — Full repository file map with descriptions
- [`ai/architecture/api_map.md`](architecture/api_map.md) — Every API endpoint documented
- [`ai/architecture/database.md`](architecture/database.md) — All 15 tables, columns, relationships

### 3. Know the Rules
- [`ai/memory/AGENTS.md`](memory/AGENTS.md) — Agent operational rules and checklists
- [`ai/memory/RULES.md`](memory/RULES.md) — Coding standards and conventions
- [`ai/memory/DECISIONS.md`](memory/DECISIONS.md) — Past technical decisions and rationale

### 4. Check Current State
- [`ai/tasks/todo.md`](tasks/todo.md) — All pending tasks (prioritized)
- [`ai/tasks/progress.md`](tasks/progress.md) — Completed, in-progress, and blocked tasks

### 5. Learn from History
- [`ai/knowledge/problems_and_solutions.md`](knowledge/problems_and_solutions.md) — Past bugs, causes, and fixes
- [`ai/knowledge/debugging_notes.md`](knowledge/debugging_notes.md) — Debug commands and common errors

---

## Quick Start for Agents

```
1. Read this file (START.md) ✓
2. Read spec/vision.md + spec/product.md
3. Read architecture/system_overview.md + architecture/codemap.md
4. Read memory/RULES.md + memory/AGENTS.md
5. Check tasks/todo.md for your assigned task
6. Check knowledge/problems_and_solutions.md for related issues
7. Begin work following the rules in memory/AGENTS.md
8. After finishing, update tasks/progress.md
```

## Critical Rules Summary

- **NEVER** delete existing code without approval
- **NEVER** modify deployed database migrations
- **NEVER** hardcode secrets in source code
- **ALWAYS** use parameterized SQL queries
- **ALWAYS** update progress.md after completing work
- **ALWAYS** document new bugs in problems_and_solutions.md

---

## Prompts

- Need to onboard a new agent? Use [`ai/prompts/load_context.md`](prompts/load_context.md)
- Need to pick up the next task? Use [`ai/prompts/next_task.md`](prompts/next_task.md)
