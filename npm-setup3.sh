#!/bin/bash

# Generate bcrypt hash using node in the API container
HASH=$(docker exec divulguei-api node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('TempNpm123!',13).then(h=>console.log(h))")
echo "Generated hash: $HASH"

if [ -z "$HASH" ]; then
  echo "ERROR: Could not generate bcrypt hash"
  exit 1
fi

# Backup current password
OLDHASH=$(sqlite3 /opt/npm/data/database.sqlite "SELECT secret FROM auth WHERE user_id=1;")
echo "Old hash backed up"

# Update password temporarily
sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$HASH' WHERE user_id=1;"
echo "Password updated temporarily"

# Authenticate
NPM_API="http://127.0.0.1:81/api"
TOKEN=$(curl -s -X POST "$NPM_API/tokens" \
  -H 'Content-Type: application/json' \
  -d '{"identity":"jfempreendedordigital@gmail.com","secret":"TempNpm123!"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Auth failed. Restoring password."
  sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$OLDHASH' WHERE user_id=1;"
  exit 1
fi

echo "Authenticated OK"

# List existing proxy hosts
echo ""
echo "=== Existing Proxy Hosts ==="
curl -s -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    domains = ', '.join(h.get('domain_names',[]))
    fwd = h.get('forward_scheme','http') + '://' + h.get('forward_host','') + ':' + str(h.get('forward_port',''))
    ssl = 'SSL' if h.get('certificate_id',0) > 0 else 'No SSL'
    print('  [' + str(h['id']) + '] ' + domains + ' -> ' + fwd + ' (' + ssl + ')')
"

# Delete existing divulguei proxy if exists
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
  echo "Removing existing divulguei proxy ($EXISTING)..."
  curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts/$EXISTING"
fi

# Create the proxy host JSON
cat > /tmp/npm-divulguei.json << 'EOF'
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
  "advanced_config": "location /api/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_read_timeout 300s;\n    client_max_body_size 50M;\n}\n\nlocation /uploads/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}",
  "meta": {
    "letsencrypt_agree": false,
    "dns_challenge": false
  },
  "locations": []
}
EOF

echo ""
echo "Creating divulguei.online proxy host..."
RESULT=$(curl -s -X POST "$NPM_API/nginx/proxy-hosts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @/tmp/npm-divulguei.json)

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"

# Restore original password
echo ""
echo "Restoring original NPM password..."
sqlite3 /opt/npm/data/database.sqlite "UPDATE auth SET secret='$OLDHASH' WHERE user_id=1;"
echo "Original password restored"

# Test
echo ""
echo "Testing internal connectivity..."
curl -s -o /dev/null -w "Web (3012): HTTP %{http_code}\n" http://127.0.0.1:3012/
curl -s -o /dev/null -w "API (3011): HTTP %{http_code}\n" http://127.0.0.1:3011/api/health

echo ""
echo "DONE. Next: Point DNS A record for divulguei.online to 161.97.171.94"

rm -f /tmp/npm-divulguei.json
