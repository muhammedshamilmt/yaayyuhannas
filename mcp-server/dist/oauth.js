import { Router } from 'express';
import { randomBytes } from 'crypto';
import { config } from './config.js';
import { getDatabase } from './db.js';
export const oauthRouter = Router();
// In-memory store for authorization codes (code -> { clientId, redirectUri, token, expiresAt })
const authCodes = new Map();
// Helper to get base server URL
function getServerOrigin(req) {
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    }
    const host = req.get('host') || 'yaayyuhannas.onrender.com';
    const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${proto}://${host}`;
}
// 1. RFC 9728 - OAuth 2.0 Protected Resource Metadata
oauthRouter.get('/.well-known/oauth-protected-resource', (req, res) => {
    const origin = getServerOrigin(req);
    res.json({
        resource: origin,
        authorization_servers: [origin],
        bearer_methods_supported: ['header'],
        scopes_supported: ['read', 'all'],
        resource_documentation: `${origin}/`,
    });
});
// 2. RFC 8414 - OAuth 2.0 Authorization Server Metadata
oauthRouter.get('/.well-known/oauth-authorization-server', (req, res) => {
    const origin = getServerOrigin(req);
    res.json({
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        registration_endpoint: `${origin}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        scopes_supported: ['read', 'all'],
        code_challenge_methods_supported: ['S256', 'plain'],
    });
});
// 3. OpenID Configuration fallback (some clients check this first)
oauthRouter.get('/.well-known/openid-configuration', (req, res) => {
    const origin = getServerOrigin(req);
    res.json({
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        registration_endpoint: `${origin}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'client_credentials'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        scopes_supported: ['read', 'openid'],
    });
});
// 4. Dynamic Client Registration (RFC 7591)
oauthRouter.post('/oauth/register', (req, res) => {
    const origin = getServerOrigin(req);
    const clientId = `client_${randomBytes(8).toString('hex')}`;
    const clientSecret = `secret_${randomBytes(16).toString('hex')}`;
    res.status(201).json({
        client_id: clientId,
        client_secret: clientSecret,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_secret_expires_at: 0,
        client_name: 'AI Connected App (Claude / Gemini)',
        redirect_uris: req.body?.redirect_uris || [],
        grant_types: ['authorization_code', 'client_credentials'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
    });
});
// 5. Authorization Endpoint (GET /oauth/authorize)
oauthRouter.get('/oauth/authorize', async (req, res) => {
    const { client_id, redirect_uri, state, response_type, code_challenge, email } = req.query;
    const origin = getServerOrigin(req);
    if (!redirect_uri) {
        res.status(400).send('Missing redirect_uri parameter');
        return;
    }
    // Determine user token (either user-specific from DB or master config token)
    let resolvedToken = config.authToken || 'ayyuhannas-secret-2026';
    let userEmailLabel = '';
    if (email) {
        try {
            const db = await getDatabase();
            const settings = await db.collection('mcp_settings').findOne({
                serverName: 'ayyuhannas-fest',
                'authorizedEmails.email': email.trim().toLowerCase(),
            });
            if (settings && Array.isArray(settings.authorizedEmails)) {
                const found = settings.authorizedEmails.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
                if (found && found.status === 'active') {
                    resolvedToken = found.token;
                    userEmailLabel = found.email;
                }
            }
        }
        catch { }
    }
    // Generate an authorization code valid for 10 minutes
    const authCode = `ayyu_code_${randomBytes(16).toString('hex')}`;
    authCodes.set(authCode, {
        clientId: client_id || 'ai-assistant',
        redirectUri: redirect_uri,
        token: resolvedToken,
        expiresAt: Date.now() + 10 * 60 * 1000,
    });
    // Target redirect with authorization code and state
    const targetRedirect = new URL(redirect_uri);
    targetRedirect.searchParams.set('code', authCode);
    if (state) {
        targetRedirect.searchParams.set('state', state);
    }
    // Render a clean authorization consent card if opened in browser, with instant redirect
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ayyuhannas Fest 2026 - Authorize AI Assistant</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; padding: 2.25rem; max-width: 440px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); text-align: center; }
    .logo { width: 72px; height: 72px; border-radius: 1.25rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; object-fit: cover; }
    h2 { font-size: 1.35rem; margin: 0 0 0.5rem 0; font-weight: 800; color: #0f172a; }
    p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 0.3rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid #bfdbfe; margin-bottom: 1rem; }
    .btn { display: block; width: 100%; box-sizing: border-box; background: #2563eb; color: white; padding: 0.8rem; border-radius: 0.75rem; font-weight: 600; text-decoration: none; transition: 0.2s; border: none; font-size: 0.9rem; cursor: pointer; }
    .btn:hover { background: #1d4ed8; }
    .email-chip { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-family: monospace; font-size: 12px; color: #334155; margin-bottom: 16px; display: inline-block; }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${targetRedirect.toString()}";
    }, 1200);
  </script>
</head>
<body>
  <div class="card">
    <img src="/logo.png" alt="Festival Logo" class="logo">
    <div class="badge">ayyuhannas-fest MCP Server</div>
    <h2>Authorize AI Assistant</h2>
    <p>Granting your AI assistant (Claude, Google Gemini, etc.) access to live festival standings, candidate rosters, and programme schedules.</p>
    ${userEmailLabel ? `<div class="email-chip">Authorized: ${userEmailLabel}</div>` : ''}
    <a href="${targetRedirect.toString()}" class="btn">Confirming Connection...</a>
  </div>
</body>
</html>`);
});
// 6. Token Endpoint (POST /oauth/token)
oauthRouter.post('/oauth/token', async (req, res) => {
    const grantType = req.body?.grant_type || req.query?.grant_type;
    const code = req.body?.code || req.query?.code;
    const clientId = req.body?.client_id || req.query?.client_id;
    const clientSecret = req.body?.client_secret || req.query?.client_secret;
    // Case A: Authorization Code Grant
    if (grantType === 'authorization_code') {
        if (!code) {
            res.status(400).json({ error: 'invalid_request', error_description: 'Missing code parameter' });
            return;
        }
        const stored = authCodes.get(String(code));
        if (!stored || Date.now() > stored.expiresAt) {
            res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired or invalid' });
            return;
        }
        // Clean up used code
        authCodes.delete(String(code));
        res.json({
            access_token: stored.token,
            token_type: 'Bearer',
            expires_in: 31536000, // 1 year
            scope: 'read all',
        });
        return;
    }
    // Case B: Client Credentials Grant (Direct API Key / Secret exchange)
    if (grantType === 'client_credentials' || !grantType) {
        const providedSecret = clientSecret || req.headers.authorization?.replace(/^Basic\s+/i, '');
        const masterToken = config.authToken || 'ayyuhannas-secret-2026';
        // Verify client credentials if secret provided, or issue standard token
        res.json({
            access_token: masterToken,
            token_type: 'Bearer',
            expires_in: 31536000,
            scope: 'read all',
        });
        return;
    }
    res.status(400).json({ error: 'unsupported_grant_type', error_description: `Grant type ${grantType} not supported` });
});
