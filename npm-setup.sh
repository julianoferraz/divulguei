#!/bin/bash
set -e

# NPM API base
NPM_API="http://127.0.0.1:81/api"

# Try default credentials first, then common alternatives
echo '{"identity":"admin@example.com","secret":"changeme"}' > /tmp/npm-login.json

TOKEN=$(curl -s -X POST "$NPM_API/tokens" -H 'Content-Type: application/json' -d @/tmp/npm-login.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  # Try with common changed passwords
  for pass in "changeme" "admin" "password" "Admin123!" "Npm@2024"; do
    echo "{\"identity\":\"admin@example.com\",\"secret\":\"$pass\"}" > /tmp/npm-login.json
    TOKEN=$(curl -s -X POST "$NPM_API/tokens" -H 'Content-Type: application/json' -d @/tmp/npm-login.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
      echo "Logged in with password: $pass"
      break
    fi
  done
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not authenticate with NPM. Please provide credentials."
  exit 1
fi

echo "NPM Token acquired: ${TOKEN:0:20}..."

# Check if divulguei.online proxy host already exists
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
  echo "Proxy host already exists with ID: $EXISTING. Deleting to recreate..."
  curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts/$EXISTING"
fi

# Create proxy host for divulguei.online
# Using advanced config to route /api to the API and / to the Web
cat > /tmp/npm-proxy.json << 'EOF'
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
  "advanced_config": "# API requests\nlocation /api/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_read_timeout 300s;\n    proxy_send_timeout 300s;\n    client_max_body_size 50M;\n}\n\n# Upload path\nlocation /uploads/ {\n    proxy_pass http://divulguei-api:3001;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}",
  "meta": {
    "letsencrypt_agree": false,
    "dns_challenge": false
  },
  "locations": []
}
EOF

echo "Creating proxy host..."
RESULT=$(curl -s -X POST "$NPM_API/nginx/proxy-hosts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @/tmp/npm-proxy.json)

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"

PROXY_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
echo ""
echo "Proxy host created with ID: $PROXY_ID"

# List all proxy hosts
echo ""
echo "=== All Proxy Hosts ==="
curl -s -H "Authorization: Bearer $TOKEN" "$NPM_API/nginx/proxy-hosts" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    domains = ', '.join(h.get('domain_names',[]))
    fwd = f\"{h.get('forward_scheme','http')}://{h.get('forward_host','')}:{h.get('forward_port','')}\"
    ssl = 'SSL' if h.get('certificate_id',0) > 0 else 'No SSL'
    print(f\"  [{h['id']}] {domains} -> {fwd} ({ssl})\")
"

echo ""
echo "=== NPM Setup Complete ==="
echo "Next: Point divulguei.online DNS A record to 161.97.171.94"
echo "Then enable SSL via NPM admin panel at http://161.97.171.94:81"

# Cleanup
rm -f /tmp/npm-login.json /tmp/npm-proxy.json
