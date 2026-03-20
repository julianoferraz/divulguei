Date:
Type:
Decision:
Reason:
Impact:
Files affected:
---

Date: 2026-03-20
Type: Infrastructure / DevOps
Decision: Aplicar limites de CPU e memória em todos os containers Docker do VPS.
Reason: Auditoria revelou que divulguei-bot consumia 4.08 GiB de RAM sem nenhum limite, representando 17% do total do VPS e risco direto de OOM Kill para os projetos de produção. Nenhum dos containers do projeto tinha limites configurados.
Impact: Bot limitado a 1GB (suficiente para operação normal). Todos os serviços protegidos. Projeto não pode mais impactar produção por consumo excessivo.
Files:
- `docker-compose.yml` (postgres=128M/0.25, redis=64M/0.25, api=128M/0.25, web=128M/0.25, bot=1G/0.50)
- Limites ativos via `docker update` (sem restart de containers)
