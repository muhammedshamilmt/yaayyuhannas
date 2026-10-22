import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { getDatabase } from '../db.js';

export async function authenticateMcpRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Always allow CORS preflight (OPTIONS) and health/info probes (HEAD)
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return next();
  }

  // Extract token from header, basic auth, body, or query
  let clientToken: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    clientToken = authHeader.substring(7).trim();
  } else if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.substring(6).trim(), 'base64').toString('utf8');
      const [username, password] = decoded.split(':');
      if (password === config.authToken || username === config.authToken) {
        return next();
      }
      clientToken = password || username;
    } catch {}
  } else if (req.headers['x-api-key'] && typeof req.headers['x-api-key'] === 'string') {
    clientToken = req.headers['x-api-key'].trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    clientToken = req.query.token.trim();
  } else if (req.body?.client_secret && typeof req.body.client_secret === 'string') {
    clientToken = req.body.client_secret.trim();
  }

  // 1. Allow protocol handshake discovery methods (initialize, ping, notifications/initialized)
  // This is required so Claude, Google Gemini & MCP clients can complete protocol negotiation
  const rpcMethod = Array.isArray(req.body) ? req.body[0]?.method : req.body?.method;
  if (rpcMethod === 'initialize' || rpcMethod === 'ping' || rpcMethod === 'notifications/initialized') {
    return next();
  }

  // 2. Allow initial GET stream handshake or probe for /sse and /mcp
  if (req.method === 'GET' && (req.path === '/sse' || req.path === '/mcp' || req.path === '/')) {
    return next();
  }

  // If no auth token is required on server and none provided, allow
  if (!config.authToken && !clientToken) {
    return next();
  }

  // 3. Check against master config token
  if (clientToken && config.authToken && clientToken === config.authToken) {
    return next();
  }

  // 4. Dynamic DB check: check masterAuthToken or active whitelisted user in MongoDB
  if (clientToken) {
    try {
      const db = await getDatabase();
      const settings = await db.collection('mcp_settings').findOne({
        serverName: 'ayyuhannas-fest',
      });

      if (settings) {
        // A. Match master token from DB settings
        if (settings.masterAuthToken && clientToken === settings.masterAuthToken) {
          return next();
        }

        // B. Match user-specific token from authorizedEmails
        if (Array.isArray(settings.authorizedEmails)) {
          const user = settings.authorizedEmails.find((u: any) => u.token === clientToken);
          if (user && user.status === 'active') {
            // Record access timestamp in background
            db.collection('mcp_settings').updateOne(
              { serverName: 'ayyuhannas-fest', 'authorizedEmails.token': clientToken },
              { $set: { 'authorizedEmails.$.lastAccessedAt': new Date().toISOString() } }
            ).catch(() => {});

            return next();
          }
        }
      }
    } catch (dbErr) {
      console.error('[Auth] Database token check error:', dbErr);
    }
  }

  // If none matched, deny request with standard RFC 9728 OAuth challenge header
  const origin = process.env.RENDER_EXTERNAL_URL?.replace(/\/+$/, '') || 'https://yaayyuhannas.onrender.com';
  res.setHeader(
    'WWW-Authenticate',
    `Bearer realm="ayyuhannas-fest", resource_metadata="${origin}/.well-known/oauth-protected-resource", authorization_uri="${origin}/oauth/authorize", token_uri="${origin}/oauth/token"`
  );

  res.status(401).json({
    jsonrpc: '2.0',
    error: {
      code: -32001,
      message: 'Unauthorized: Invalid or revoked MCP authentication token. Please check your authorization in the festival admin panel.',
    },
    id: null,
  });
}
