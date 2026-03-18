# Debugging Notes — Divulguei.Online

> Quick reference for debugging common scenarios.

---

## Accessing Logs

```bash
# API logs
docker logs divulguei-api --tail 50 -f

# Bot logs
docker logs divulguei-bot --tail 50 -f

# Web/Nginx logs
docker logs divulguei-web --tail 50 -f

# PostgreSQL logs
docker logs divulguei-postgres --tail 50 -f

# Redis logs
docker logs divulguei-redis --tail 50 -f
```

## Database Access

```bash
# Connect to PostgreSQL
docker exec -it divulguei-postgres psql -U divulguei -d divulguei

# Useful queries
SELECT count(*) FROM businesses WHERE is_active = true;
SELECT count(*) FROM classifieds WHERE status = 'active';
SELECT * FROM interactions ORDER BY created_at DESC LIMIT 10;
SELECT query, count(*) FROM interactions WHERE type = 'search' GROUP BY query ORDER BY count DESC LIMIT 20;
```

## Redis Access

```bash
# Connect to Redis
docker exec -it divulguei-redis redis-cli

# Check auth codes
KEYS auth:code:*

# Check bot sessions
KEYS bot:session:*

# Check rate limiting
KEYS ratelimit:*
```

## Container Management

```bash
# Restart single service
docker compose restart divulguei-api

# Rebuild and restart
docker compose up -d --build divulguei-api

# Full stack restart
docker compose down && docker compose up -d

# Check service health
docker compose ps
```

## Common Error Patterns

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `ECONNREFUSED :5432` | PostgreSQL not ready | Wait for pg to start, check health |
| `ECONNREFUSED :6379` | Redis not ready | Wait for redis to start |
| `JWT malformed` | Invalid/expired token | Re-authenticate, check JWT_SECRET |
| `relation "X" does not exist` | Migrations not run | Run `npm run migrate` in API |
| `OPENAI_API_KEY invalid` | Bad API key | Check .env, verify key in OpenAI dashboard |
| `Baileys connection closed` | WhatsApp session expired | Re-scan QR code, check auth volume |
| `ENOMEM` | Server out of memory | Check `docker stats`, scale resources |

## Slow Query Detection

The database config (`packages/api/src/config/database.ts`) logs warnings for queries taking >1000ms. Check API logs for `SLOW QUERY` entries.

## Network Debugging

```bash
# Check if API is reachable from web container
docker exec divulguei-web curl -s http://divulguei-api:3001/api/health

# Check external connectivity
docker exec divulguei-api curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

*Add new debugging discoveries here as they occur.*
