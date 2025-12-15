# 🔒 Secure Bitcoin Core JSON-RPC Proxy

[![Build and Push Docker Image](https://github.com/dmytro-samoylenko/bitcoin-fullnode-proxy/actions/workflows/docker-build.yml/badge.svg)](https://github.com/dmytro-samoylenko/bitcoin-fullnode-proxy/actions/workflows/docker-build.yml)

A lightweight, nginx + njs-based reverse proxy that restricts JSON-RPC API access to your Bitcoin full node. Configure method whitelists, add authentication layers, and protect bitcoind from unauthorized or dangerous calls.

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

### Using Pre-built Docker Image

Pull from GitHub Container Registry:

```bash
# Pull the image
docker pull ghcr.io/dmytro-samoylenko/bitcoin-fullnode-proxy:latest

# Run the image
docker run -p 8080:80 \
  -e NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx \
  -e NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
  -e ALLOWED_METHODS="getblockchaininfo,getblockcount,getbestblockhash" \
  -e BACKEND_HOST="your-bitcoin-node:8332" \
  ghcr.io/dmytro-samoylenko/bitcoin-fullnode-proxy:latest
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Building from Source

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
- `nginx.conf.template`: Nginx configuration template with njs module
- `jsonrpc-filter.js`: njs script that handles request filtering
- `docker-compose.yml`: Example docker-compose setup
- `.github/workflows/docker-build.yml`: GitHub Actions workflow for automated builds

## GitHub Actions Setup

The repository includes a GitHub Actions workflow that automatically builds and pushes Docker images to both Docker Hub and GitHub Container Registry.

### Required Secrets

No additional secrets required! The workflow uses the built-in `GITHUB_TOKEN` for authentication with GitHub Container Registry.

### Workflow Triggers

The workflow runs on:
- **Push to main/master branch**: Builds and pushes with `latest` tag
- **Git tags** (e.g., `v1.0.0`): Builds and pushes with version tags
- **Pull requests**: Builds only (no push) for testing

### Image Location

After the workflow runs, images are available at:
- GitHub Container Registry: `ghcr.io/dmytro-samoylenko/bitcoin-fullnode-proxy`

### Multi-Architecture Support

The workflow builds for both `linux/amd64` and `linux/arm64` platforms.
