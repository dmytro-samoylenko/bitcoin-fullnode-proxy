# Bitcoin Full Node Proxy

An nginx-based reverse proxy for Bitcoin full nodes that filters JSON-RPC 1.0 requests against a whitelist of allowed methods.

## Features

- Built on latest nginx with njs (nginx JavaScript) module
- Filters incoming JSON-RPC 1.0 requests against a whitelist
- Only allows methods defined in environment variable
- Returns standard JSON-RPC error responses for disallowed methods
- Forwards allowed requests to backend Bitcoin node
- Returns responses from backend

## Configuration

Set the following environment variables:

- `ALLOWED_METHODS`: Comma-separated list of allowed JSON-RPC methods (e.g., `getblockchaininfo,getblockcount,getbestblockhash`)
- `BACKEND_HOST`: Backend Bitcoin node address in format `host:port` (e.g., `localhost:8332`)

### ⚠️ CRITICAL: Required nginx Environment Variables

**YOU MUST SET THESE** for the nginx template substitution to work:

```yaml
environment:
  - NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx
  - NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
```

**Why this is critical:**
- The nginx official image uses `envsubst` to substitute `${BACKEND_HOST}` in the nginx configuration
- Without `NGINX_ENVSUBST_TEMPLATE_DIR`, the template file won't be processed
- Without `NGINX_ENVSUBST_OUTPUT_DIR`, the substituted config won't be written to the correct location
- **If these are missing, nginx will try to proxy to a literal `${BACKEND_HOST}` URL and fail**
- This is the most common cause of "Internal error" or connection failures

## Usage

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t bitcoin-proxy .
docker run -p 8080:80 \
  -e NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx \
  -e NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
  -e ALLOWED_METHODS="getblockchaininfo,getblockcount,getbestblockhash" \
  -e BACKEND_HOST="your-bitcoin-node:8332" \
  bitcoin-proxy
```

**Note:** The `NGINX_ENVSUBST_*` variables are required for the nginx official image to process template variables.

### Testing

Send a JSON-RPC request to the proxy:

```bash
# Allowed method (will be forwarded)
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"1.0","id":"test","method":"getblockcount","params":[]}'

# Disallowed method (will return error)
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"1.0","id":"test","method":"sendtoaddress","params":[]}'
```

## Error Responses

The proxy returns standard JSON-RPC 1.0 error responses:

- **Method not allowed** (403):
  ```json
  {
    "jsonrpc": "1.0",
    "error": {
      "code": -32601,
      "message": "Method not allowed"
    },
    "id": "request-id"
  }
  ```

- **Parse error** (400):
  ```json
  {
    "jsonrpc": "1.0",
    "error": {
      "code": -32700,
      "message": "Parse error"
    },
    "id": null
  }
  ```

- **Invalid Request** (400):
  ```json
  {
    "jsonrpc": "1.0",
    "error": {
      "code": -32600,
      "message": "Invalid Request"
    },
    "id": "request-id"
  }
  ```

## Files

- `Dockerfile`: Container definition based on nginx:latest
- `nginx.conf`: Nginx configuration with njs module
- `jsonrpc-filter.js`: njs script that handles request filtering
- `docker-compose.yml`: Example docker-compose setup
