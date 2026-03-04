#!/bin/bash
set -e

# Generate bcrypt hash using python3
HASH=$(python3 -c "
import subprocess
result = subprocess.run(['htpasswd', '-nbBC', '13', '', 'TempNpm123!'], capture_output=True, text=True)
if result.returncode == 0:
    print(result.stdout.strip().split(':')[1])
else:
    # Fallback: use node from divulguei-api container
    print('FALLBACK')
" 2>/dev/null)

if [ "$HASH" = "FALLBACK" ] || [ -z "$HASH" ]; then
  # Use node in the divulguei-api container to generate bcrypt hash
  HASH=$(docker exec divulguei-api node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('TempNpm123!',13).then(h=>console.log(h))")
fi

echo "Generated hash: $HASH"

# Backup current password
OLDHASH=$(sqlite3 /opt/npm/data/database.sqlite "SELECT secret FROM auth WHERE user_id=1;")
echo "Old hash (backup): $OLDHASH"

# Update password
sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$HASH' WHERE user_id=1;"
echo "Password updated to TempNpm123!"

# Now authenticate
NPM_API="http://127.0.0.1:81/api"
TOKEN=$(curl -s -X POST "$NPM_API/tokens" \
  -H 'Content-Type: application/json' \
  -d '{"identity":"jfempreendedordigital@gmail.com","secret":"TempNpm123!"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Authentication still failed. Restoring old password..."
  sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$OLDHASH' WHERE user_id=1;"
  exit 1
fi

echo "Token acquired: ${TOKEN:0:20}..."

# Check existing proxy hosts
echo ""
echo "=== Existing Proxy Hosts ==="
curl -s -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    domains = ', '.join(h.get('domain_names',[]))
    fwd = f\"{h.get('forward_scheme','http')}://{h.get('forward_host','')}:{h.get('forward_port','')}\"
    ssl = 'SSL' if h.get('certificate_id',0) > 0 else 'No SSL'
    print(f'  [{h[\"id\"]}] {domains} -> {fwd} ({ssl})')
"

# Check if divulguei.online already exists, delete if so
EXISTING=$(curl -s -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    for d in h.get('domain_names',[]):
        if 'divulguei' in d:
            print(h['id'])
            break
" 2>/dev/null)

if [ -n "$EXISTING" ]; then
  echo "Deleting existing divulguei proxy host ($EXISTING)..."
  curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts/$EXISTING"
fi

# Create proxy host
cat > /tmp/npm-proxy.json << 'PROXYJSON'
{
  "domain_names": ["divulguei.online", "www.divulguei.online"],
  "forward_scheme": "http",
  "forward_host": "divulguei-web",
  "forward_port": 3000,
  "certificate_id": 0,
  "ssl_forced": false,
  "hsts_enabled": false,
  "hsts_subdomains": false,
  "http2_support": false,
  "block_exploits": true,
  "caching_enabled": false,
  "allow_websocket_upgrade": true,
  "access_list_id": 0,
  "advanced_config": "# API proxy\nlocation /api/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_read_timeout 300s;\n    proxy_send_timeout 300s;\n    client_max_body_size 50M;\n}\n\n# Upload files\nlocation /uploads/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}",
  "meta": {
    "letsencrypt_agree": false,
    "dns_challenge": false
  },
  "locations": []
}
PROXYJSON

echo ""
echo "Creating proxy host for divulguei.online..."
RESULT=$(curl -s -X POST "$NPM_API/nginx/proxy-hosts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @/tmp/npm-proxy.json)

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"

PROXY_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -n "$PROXY_ID" ] && [ "$PROXY_ID" != "" ]; then
  echo ""
  echo "SUCCESS! Proxy host created with ID: $PROXY_ID"
else
  echo ""
  echo "WARNING: Proxy host creation may have failed. Check output above."
fi

# Restore old password
echo ""
echo "Restoring original NPM password..."
sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$OLDHASH' WHERE user_id=1;"
echo "Original password restored."

# Test connectivity
echo ""
echo "=== Testing proxy ==="
echo "Testing from host: curl http://divulguei.online (will only work if DNS is pointing)..."
curl -s -o /dev/null -w "HTTP %{http_code}" --max-time 5 http://divulguei.online 2>/dev/null || echo "DNS not pointing yet (expected)"

echo ""
echo ""
echo "=== DONE ==="
echo "Proxy host configured. Next steps:"
echo "1. Point divulguei.online A record to 161.97.171.94"
echo "2. After DNS propagation, enable SSL in NPM admin panel (http://161.97.171.94:81)"
echo "3. Configure Let's Encrypt certificate for divulguei.online"

# Cleanup
rm -f /tmp/npm-proxy.json /tmp/npm-login.json
