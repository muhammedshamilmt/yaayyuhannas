import { config } from '../config.js';
export function authenticateMcpRequest(req, res, next) {
    // If no token is set in config, allow access (development mode)
    if (!config.authToken || config.authToken.trim() === '') {
        return next();
    }
    // 1. Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token === config.authToken) {
            return next();
        }
    }
    // 2. Check x-api-key header
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
        if (apiKeyHeader.trim() === config.authToken) {
            return next();
        }
    }
    // 3. Check query parameter: ?token=... (for clients that cannot set custom headers on EventSource)
    const queryToken = req.query.token;
    if (queryToken && typeof queryToken === 'string') {
        if (queryToken.trim() === config.authToken) {
            return next();
        }
    }
    // If none matched, deny request
    res.status(401).json({
        jsonrpc: '2.0',
        error: {
            code: -32001,
            message: 'Unauthorized: Invalid or missing MCP authentication token.',
        },
        id: null,
    });
}
