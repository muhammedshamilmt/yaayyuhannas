import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3099;
const TEST_TOKEN = 'test-secret-token-12345';

console.log('Testing MCP Server build and endpoints...');

const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: TEST_PORT.toString(),
    MCP_AUTH_TOKEN: TEST_TOKEN,
    READ_ONLY: 'true',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

serverProcess.stderr.on('data', (d) => process.stderr.write(`[ERR] ${d}`));

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  // Wait until server outputs "MCP Server listening"
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server start timed out after 10s')), 10000);
    serverProcess.stdout.on('data', (data) => {
      const str = data.toString();
      process.stdout.write(`[MCP] ${str}`);
      if (str.includes('listening on port')) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
  });

  console.log('\n--- 1. Testing /health endpoint ---');
  const healthRes = await request({
    hostname: '127.0.0.1',
    port: TEST_PORT,
    path: '/health',
    method: 'GET',
  });
  console.log(`Health Status Code: ${healthRes.statusCode}`);
  console.log(`Health Response: ${healthRes.data}`);

  if (healthRes.statusCode !== 200) {
    throw new Error('Health check failed');
  }

  console.log('\n--- 2. Testing /sse without auth token (Expect 401) ---');
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: TEST_PORT,
    path: '/sse',
    method: 'GET',
  });
  console.log(`Unauth Status Code: ${unauthRes.statusCode}`);
  if (unauthRes.statusCode !== 401) {
    throw new Error(`Expected 401, got ${unauthRes.statusCode}`);
  }
  console.log('Token protection verified successfully!');

  console.log('\n--- 3. Testing /sse with auth token in query param (?token=...) ---');
  const sseConnected = await new Promise((resolve, reject) => {
    const sseReq = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: `/sse?token=${TEST_TOKEN}`,
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
        },
      },
      (res) => {
        console.log(`SSE Authorized Status Code: ${res.statusCode}`);
        console.log(`SSE Content-Type: ${res.headers['content-type']}`);
        if (res.statusCode === 200 && res.headers['content-type']?.includes('text/event-stream')) {
          res.on('data', (chunk) => {
            const text = chunk.toString();
            console.log(`Received initial SSE endpoint message from server:\n${text}`);
            if (text.includes('event: endpoint')) {
              sseReq.destroy();
              resolve(true);
            }
          });
        } else {
          reject(new Error(`Unexpected SSE status: ${res.statusCode}`));
        }
      }
    );

    sseReq.on('error', (err) => {
      if (err.message.includes('destroyed')) resolve(true);
      else reject(err);
    });

    // Send request!
    sseReq.end();
  });

  console.log('\nAll MCP Server automated tests passed successfully! 🎉');
}

runTests()
  .catch((err) => {
    console.error('Test error:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    serverProcess.kill('SIGTERM');
  });
