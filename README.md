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

## Usage

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t bitcoin-proxy .
docker run -p 8080:80 \
  -e ALLOWED_METHODS="getblockchaininfo,getblockcount,getbestblockhash" \
  -e BACKEND_HOST="your-bitcoin-node:8332" \
  bitcoin-proxy
```

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
