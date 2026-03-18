# Problems & Solutions — Divulguei.Online

> Troubleshooting memory for the project.  
> Agents MUST consult this file before attempting to solve any bug.

---

## Problem #1: Insecure Auth Code Generation

**Problem**: Auth verification codes were generated using `Math.random()`, which is not cryptographically secure and could be predicted.

**Cause**: Initial implementation used simple random number generation without considering security implications.

**Solution**: Replaced with `crypto.randomInt(100000, 999999)` which uses the Node.js crypto module for secure random number generation.

**Verification**: Check `packages/api/src/modules/auth/routes.ts` — ensure `crypto.randomInt()` is used for code generation.

---

## Problem #2: Classified "Improve" Endpoint Side Effects

**Problem**: The `/api/:citySlug/classifieds/improve` endpoint was creating or modifying classified records instead of just returning a preview.

**Cause**: The endpoint handler had database write operations that should only occur on the actual create/update endpoints.

**Solution**: Refactored to be a pure preview endpoint — accepts title + description, returns AI-improved description without any database changes.

**Verification**: Call `POST /api/:citySlug/classifieds/improve` with a title/description and verify no new records appear in the classifieds table.

---

## Problem #3: Bot Database Column References

**Problem**: The WhatsApp bot code referenced incorrect column names (e.g., `jid` instead of `group_jid`), causing SQL query failures.

**Cause**: Column names in the bot code did not match the actual database schema defined in migration files.

**Solution**: Updated all bot SQL queries to use correct column names matching the migration definitions.

**Verification**: Run the bot and verify group message handling works without SQL errors in logs.

---

## Problem #4: Cron Jobs Timezone Mismatch

**Problem**: Scheduled jobs (classified expiry, news fetch, alert notifications) were running at UTC times instead of local Brazilian time.

**Cause**: node-cron was not configured with a timezone, defaulting to UTC.

**Solution**: Added `timezone: 'America/Recife'` to all cron job configurations in `packages/bot/src/cron.ts`.

**Verification**: Check cron job logs to confirm they execute at the expected local times.

---

## Problem #5: Missing Admin Route Protection

**Problem**: Some admin API endpoints were accessible without admin role verification.

**Cause**: Admin middleware was not consistently applied to all routes in the admin module.

**Solution**: Added `requireAdmin` middleware check to every admin endpoint in `packages/api/src/modules/admin/routes.ts`.

**Verification**: Call any admin endpoint without admin JWT and verify 403 Forbidden response.

---

## Problem #6: File Upload MIME Type Bypass

**Problem**: File upload endpoint accepted files based on extension only, allowing dangerous file types with renamed extensions.

**Cause**: Validation checked file extension but not actual MIME type/magic bytes.

**Solution**: Added server-side MIME type validation against allowed types (image/jpeg, image/png, image/webp, image/gif) and enforced 5MB size limit.

**Verification**: Attempt to upload a non-image file renamed to .jpg — should be rejected with 400 error.

---

## Common Debugging Tips

### Docker Container Won't Start
1. Check logs: `docker logs divulguei-api --tail 50`
2. Verify environment variables are set in `.env` files
3. Ensure PostgreSQL and Redis are healthy before API starts
4. Check port conflicts on host

### Bot Not Responding
1. Check if QR code session is valid: `docker logs divulguei-bot --tail 50`
2. Verify `BOT_AUTH_DIR` volume is mounted
3. Check Redis connectivity (session state)
4. Verify OpenAI API key is valid and has credits

### API 500 Errors
1. Check detailed error in API container logs
2. Verify database connection (DATABASE_URL)
3. Check if migrations have been run
4. Verify Redis connection for auth-related endpoints

### Frontend Shows Blank Page
1. Check browser console for JavaScript errors
2. Verify `VITE_API_BASE` environment variable
3. Check Nginx configuration for SPA fallback
4. Verify API is accessible from frontend container

---

*Add new problems and solutions as they are discovered and resolved.*
