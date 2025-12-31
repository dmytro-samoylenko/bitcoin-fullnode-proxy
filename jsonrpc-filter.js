function filterRequest(r) {
    // Set response Content-Type to application/json
    r.headersOut['Content-Type'] = 'application/json';

    // Get allowed methods from environment variable
    const allowedMethodsEnv = process.env.ALLOWED_METHODS || '';
    const allowedMethods = allowedMethodsEnv.split(',').map(m => m.trim());

    // Get backend host from environment
    const backendHost = process.env.BACKEND_HOST || 'localhost:8332';

    // Read request body
    let body = '';
    try {
        body = r.requestText || r.requestBody || '';
    } catch (e) {
        r.return(400, JSON.stringify({
            jsonrpc: '1.0',
            error: {
                code: -32700,
                message: 'Parse error'
            },
            id: null
        }));
        return;
    }

    // Parse JSON-RPC request
    let jsonRpcRequest;
    try {
        jsonRpcRequest = JSON.parse(body);
    } catch (e) {
        r.return(400, JSON.stringify({
            jsonrpc: '1.0',
            error: {
                code: -32700,
                message: 'Parse error'
            },
            id: null
        }));
        return;
    }

    // Extract method name
    const method = jsonRpcRequest.method;

    if (!method) {
        r.return(400, JSON.stringify({
            jsonrpc: '1.0',
            error: {
                code: -32600,
                message: 'Invalid Request'
            },
            id: jsonRpcRequest.id || null
        }));
        return;
    }

    // Check if method is in whitelist
    if (!allowedMethods.includes(method)) {
        r.warn(`Method not allowed: ${method} (client: ${r.remoteAddress})`);
        r.return(403, JSON.stringify({
            jsonrpc: '1.0',
            error: {
                code: -32601,
                message: 'Method not allowed'
            },
            id: jsonRpcRequest.id || null
        }));
        return;
    }

    // Forward request to backend
    r.subrequest('/_backend', {
        method: r.method,
        body: body,
        headers: {
            'Authorization': r.headersIn.Authorization || '',
            'Content-Type': 'application/json'
        }
    }, function(reply) {
        if (reply.status >= 200 && reply.status < 300) {
            r.return(reply.status, reply.responseText || reply.responseBody);
        } else {
            r.return(reply.status, reply.responseText || reply.responseBody || JSON.stringify({
                jsonrpc: '1.0',
                error: {
                    code: -32603,
                    message: 'Internal error'
                },
                id: jsonRpcRequest.id || null
            }));
        }
    });
}

export default { filterRequest };
