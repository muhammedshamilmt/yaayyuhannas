import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { connectToDatabase, closeDatabase, testConnection } from './db.js';
import { authenticateMcpRequest } from './middleware/auth.js';
import { registerMetadataTools } from './tools/metadata.js';
import { registerQueryTools } from './tools/query.js';
import { registerFestivalTools } from './tools/festival.js';
import { registerDiagnosticsTools } from './tools/diagnostics.js';
import { registerAnalysisPrompts } from './prompts/analysisPrompts.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
/**
 * Creates and registers tools/prompts on a fresh McpServer instance.
 * Required per SSE connection because the MCP SDK protocol binds 1 transport per server instance.
 */
export function createMcpServer() {
    const server = new McpServer({
        name: 'ayyuhannas-fest',
        version: '1.0.0',
    });
    registerMetadataTools(server);
    registerQueryTools(server);
    registerFestivalTools(server);
    registerDiagnosticsTools(server);
    registerAnalysisPrompts(server);
    return server;
}
async function bootstrap() {
    console.log('===========================================================');
    console.log('🎪 Ayyuhannas Arts & Sports Fest 2026 - MCP Database Server');
    console.log('   Connector: ayyuhannas-fest');
    console.log('===========================================================');
    // 1. Establish Database Connection Pool
    try {
        await connectToDatabase();
        const test = await testConnection();
        console.log(`[Status] Database test: ${test.message}`);
    }
    catch (err) {
        console.error(`[Warning] Database initial connection failed: ${err.message}`);
        console.log('[Notice] The server will still start, but tools requiring DB will report connection errors.');
    }
    // 2. Check for stdio mode (local agent / CLI)
    if (process.argv.includes('--stdio')) {
        console.log('[Mode] Starting in stdio transport mode for local AI desktop/agent...');
        const server = createMcpServer();
        const stdioTransport = new StdioServerTransport();
        await server.connect(stdioTransport);
        return;
    }
    // 3. Default: Start Express HTTP + SSE Server
    const app = express();
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    }));
    app.use(express.json());
    // Serve static assets (logo, favicon)
    app.use('/public', express.static(publicDir));
    app.get('/logo.png', (_req, res) => {
        res.sendFile(path.join(publicDir, 'logo.png'));
    });
    app.get('/favicon.ico', (_req, res) => {
        res.sendFile(path.join(publicDir, 'logo.png'));
    });
    // Store active SSE transports by sessionId
    const transports = new Map();
    // Public Health check endpoint (Render uses this to verify deployment)
    app.get('/health', async (_req, res) => {
        const dbStatus = await testConnection();
        res.status(dbStatus.ok ? 200 : 503).json({
            status: dbStatus.ok ? 'healthy' : 'degraded',
            server: 'ayyuhannas-fest',
            version: '1.0.0',
            database: dbStatus.ok ? 'connected' : 'disconnected',
            readOnlyMode: config.readOnly,
            authConfigured: !!config.authToken,
            logoUrl: '/logo.png',
            timestamp: new Date().toISOString(),
        });
    });
    // Root endpoint: HTML UI for browsers, JSON for API/MCP clients
    app.get('/', async (req, res) => {
        if (req.accepts('html')) {
            const dbStatus = await testConnection();
            const host = req.get('host') || `localhost:${config.port}`;
            const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
            const baseUrl = `${protocol}://${host}`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ayyuhannas Fest - MCP Database Server</title>
  <link rel="icon" type="image/png" href="/logo.png">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 20px;
      max-width: 600px;
      width: 100%;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      text-align: center;
    }
    .logo-img {
      width: 110px;
      height: 110px;
      border-radius: 24px;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      border: 2px solid #27272a;
      object-fit: cover;
    }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #27272a;
      color: #a1a1aa;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 24px;
      font-family: monospace;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${dbStatus.ok ? '#22c55e' : '#ef4444'};
    }
    .endpoints {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 18px;
      text-align: left;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .endpoint-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #18181b;
    }
    .endpoint-row:last-child { border-bottom: none; }
    .label { color: #71717a; font-weight: 500; }
    .value { color: #38bdf8; font-family: monospace; }
    .code-block {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 16px;
      font-family: monospace;
      font-size: 12px;
      color: #e4e4e7;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="/logo.png" alt="Ayyuhannas Fest Logo" class="logo-img">
    <h1>Ayyuhannas Fest MCP Server</h1>
    <div class="badge">
      <span class="status-dot"></span>
      <span>ayyuhannas-fest • ${dbStatus.ok ? 'Database Connected' : 'Database Offline'}</span>
    </div>

    <div class="endpoints">
      <div class="endpoint-row">
        <span class="label">SSE Endpoint</span>
        <span class="value">${baseUrl}/sse</span>
      </div>
      <div class="endpoint-row">
        <span class="label">Health Check</span>
        <span class="value">${baseUrl}/health</span>
      </div>
      <div class="endpoint-row">
        <span class="label">Safety Mode</span>
        <span class="value">${config.readOnly ? 'Read-Only (Protected)' : 'Read-Write'}</span>
      </div>
      <div class="endpoint-row">
        <span class="label">Authentication</span>
        <span class="value">${config.authToken ? 'Token Protected' : 'Open'}</span>
      </div>
    </div>

    <div class="code-block">{
  "mcpServers": {
    "ayyuhannas-fest": {
      "url": "${baseUrl}/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_AUTH_TOKEN"
      }
    }
  }
}</div>

    <p class="footer">Connect to Claude Desktop, Cursor, Gemini, or ChatGPT</p>
  </div>
</body>
</html>`);
            return;
        }
        res.json({
            name: 'ayyuhannas-fest',
            title: 'Ayyuhannas Arts & Sports Fest 2026 - MCP Database Server',
            protocol: 'Model Context Protocol (MCP) 2024-11-05',
            logoUrl: '/logo.png',
            endpoints: {
                sse: '/sse',
                messages: '/messages',
                health: '/health',
                logo: '/logo.png',
            },
            auth: config.authToken ? 'Token Required (Bearer or ?token=...)' : 'Open Development Mode',
            instructions: 'Connect this endpoint to Claude Desktop, Cursor, Gemini, or ChatGPT via SSE.',
        });
    });
    // SSE stream endpoint
    app.get('/sse', authenticateMcpRequest, async (req, res) => {
        console.log(`[SSE] Incoming client connection from ${req.ip}`);
        // Explicit headers for Render, Cloudflare, Nginx, and proxies
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Prevents proxy buffering
        if (typeof res.flushHeaders === 'function') {
            res.flushHeaders();
        }
        // Create new SSE transport directing client to POST to /messages
        const transport = new SSEServerTransport('/messages', res);
        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);
        // CRITICAL: Send periodic SSE heartbeat ping every 15 seconds to prevent Render, Cloudflare, proxies, and browser agents from dropping the connection!
        const keepaliveTimer = setInterval(() => {
            try {
                if (!res.writableEnded) {
                    res.write(': keepalive\n\n');
                }
                else {
                    clearInterval(keepaliveTimer);
                }
            }
            catch {
                clearInterval(keepaliveTimer);
            }
        }, 15000);
        req.on('close', () => {
            console.log(`[SSE] Client disconnected session: ${sessionId}`);
            clearInterval(keepaliveTimer);
            transports.delete(sessionId);
        });
        try {
            const serverInstance = createMcpServer();
            await serverInstance.connect(transport);
            console.log(`[SSE] Session initialized and connected: ${sessionId}`);
        }
        catch (err) {
            clearInterval(keepaliveTimer);
            console.error(`[SSE] Connection error for session ${sessionId}:`, err);
        }
    });
    // JSON-RPC message endpoint
    app.post('/messages', authenticateMcpRequest, async (req, res) => {
        const sessionId = req.query.sessionId;
        if (!sessionId) {
            res.status(400).send('Missing sessionId query parameter');
            return;
        }
        const transport = transports.get(sessionId);
        if (!transport) {
            res.status(404).send(`Session ${sessionId} not found or expired`);
            return;
        }
        try {
            await transport.handlePostMessage(req, res);
        }
        catch (err) {
            console.error(`[Messages] Error handling post message:`, err);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        }
    });
    const serverPort = config.port;
    // Explicitly bind to 0.0.0.0 for Render, Docker, and Cloud compatibility
    const httpServer = app.listen(serverPort, '0.0.0.0', () => {
        console.log(`[Ready] MCP Server (ayyuhannas-fest) listening on port ${serverPort} (0.0.0.0)`);
        console.log(`[Ready] SSE endpoint: http://localhost:${serverPort}/sse`);
        console.log(`[Ready] Read-only mode: ${config.readOnly}`);
        console.log(`[Ready] Auth configured: ${!!config.authToken}`);
        console.log(`[Ready] Logo endpoint: http://localhost:${serverPort}/logo.png`);
        // Self-KeepAlive for Render Free Tier (Pings /health every 10 minutes to prevent spindown)
        const selfUrl = process.env.RENDER_EXTERNAL_URL || 'https://yaayyuhannas.onrender.com';
        if (selfUrl && !selfUrl.includes('localhost') && !selfUrl.includes('127.0.0.1')) {
            const pingTarget = `${selfUrl.replace(/\/+$/, '')}/health`;
            console.log(`[KeepAlive] Scheduled self-ping to prevent Render sleep: ${pingTarget} (every 10m)`);
            setTimeout(() => {
                fetch(pingTarget).then(() => {
                    console.log(`[KeepAlive] Initial self-ping successful`);
                }).catch(() => { });
            }, 30000);
            setInterval(async () => {
                try {
                    const res = await fetch(pingTarget);
                    console.log(`[KeepAlive] Self-ping status: ${res.status} at ${new Date().toISOString()}`);
                }
                catch (err) {
                    console.warn(`[KeepAlive] Self-ping error:`, err.message);
                }
            }, 10 * 60 * 1000);
        }
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n[Shutdown] Shutting down MCP server gracefully...');
        httpServer.close();
        await closeDatabase();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
bootstrap().catch((err) => {
    console.error('[Fatal] Bootstrap failed:', err);
    process.exit(1);
});
