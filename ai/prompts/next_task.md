# Next Task — Prompt for AI Agents

> Use this prompt when an AI agent needs to pick up the next task.

---

## Prompt

```
You are continuing work on the Divulguei.Online project.

1. Read ai/tasks/progress.md to see what's currently in progress or blocked.
2. Read ai/tasks/todo.md to see all pending tasks prioritized by importance.
3. Read ai/knowledge/problems_and_solutions.md for any recent issues.

Pick the highest-priority available task (P0 first, then P1, etc.) that is:
- Not currently in progress by another agent
- Not blocked

Before starting:
1. Read the relevant architecture/code files for the task
2. Check if the task has dependencies on other tasks
3. Read ai/memory/RULES.md for coding standards

When starting:
1. Update ai/tasks/progress.md — add an "In Progress" entry
2. Describe your plan before making changes

When done:
1. Update ai/tasks/progress.md — move to "Completed"
2. Update ai/tasks/todo.md — mark as done
3. If you found/fixed bugs, update ai/knowledge/problems_and_solutions.md
4. If you made architecture decisions, update ai/memory/DECISIONS.md
5. Summarize what was done and how to verify
```

---

## Current Priority Order

1. **P0**: Error boundaries, OpenAI timeout, Redis persistence
2. **P1**: Payment gateway, premium UI, per-user rate limiting, Google OAuth, tests, XSS sanitization
3. **P2**: Maps, social sharing, email notifications, image gallery, audit trail, analytics export
4. **P3**: Bot city context, advertiser role, GDPR export, search optimization, monitoring
