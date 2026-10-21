import { config } from '../config.js';
import { getDatabase } from '../db.js';
export async function authenticateMcpRequest(req, res, next) {
    // Extract token from header or query
    let clientToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        clientToken = authHeader.substring(7).trim();
    }
    else if (req.headers['x-api-key'] && typeof req.headers['x-api-key'] === 'string') {
        clientToken = req.headers['x-api-key'].trim();
    }
    else if (req.query.token && typeof req.query.token === 'string') {
        clientToken = req.query.token.trim();
    }
    // If no auth token is required on server and none provided, allow
    if (!config.authToken && !clientToken) {
        return next();
    }
    // 1. Check against master config token
    if (clientToken && config.authToken && clientToken === config.authToken) {
        return next();
    }
    // 2. Dynamic DB check: check if token belongs to an active whitelisted user in MongoDB
    if (clientToken) {
        try {
            const db = await getDatabase();
            const settings = await db.collection('mcp_settings').findOne({
                serverName: 'ayyuhannas-fest',
                'authorizedEmails.token': clientToken,
            });
            if (settings && Array.isArray(settings.authorizedEmails)) {
                const user = settings.authorizedEmails.find((u) => u.token === clientToken);
                if (user && user.status === 'active') {
                    // Record access timestamp in background
                    db.collection('mcp_settings').updateOne({ serverName: 'ayyuhannas-fest', 'authorizedEmails.token': clientToken }, { $set: { 'authorizedEmails.$.lastAccessedAt': new Date().toISOString() } }).catch(() => { });
                    return next();
                }
            }
        }
        catch (dbErr) {
            console.error('[Auth] Database token check error:', dbErr);
        }
    }
    // If none matched, deny request
    res.status(401).json({
        jsonrpc: '2.0',
        error: {
            code: -32001,
            message: 'Unauthorized: Invalid or revoked MCP authentication token. Please check your authorization in the festival admin panel.',
        },
        id: null,
    });
}
