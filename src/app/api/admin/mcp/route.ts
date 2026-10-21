import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { randomBytes } from 'crypto';

export interface McpAuthorizedUser {
  id: string;
  email: string;
  name?: string;
  token: string;
  status: 'active' | 'revoked';
  role: 'admin' | 'viewer';
  createdAt: string;
  lastAccessedAt?: string;
}

export interface McpSettings {
  serverName: string;
  cloudServerUrl: string;
  masterAuthToken: string;
  readOnly: boolean;
  authorizedEmails: McpAuthorizedUser[];
  updatedAt: string;
}

const DEFAULT_SETTINGS: McpSettings = {
  serverName: 'ayyuhannas-fest',
  cloudServerUrl: process.env.MCP_CLOUD_URL || 'https://yaayyuhannas.onrender.com',
  masterAuthToken: process.env.MCP_AUTH_TOKEN || 'ayyuhannas-secret-2026',
  readOnly: true,
  authorizedEmails: [],
  updatedAt: new Date().toISOString(),
};

async function getOrCreateSettings(db: any) {
  let settings = await db.collection('mcp_settings').findOne({ serverName: 'ayyuhannas-fest' });
  if (!settings) {
    const doc = {
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('mcp_settings').insertOne(doc);
    settings = doc;
  } else if (
    !settings.cloudServerUrl || 
    settings.cloudServerUrl === 'https://ayyuhannas-fest-mcp.onrender.com'
  ) {
    // Auto-migrate placeholder URL to the real live Render URL
    const realUrl = 'https://yaayyuhannas.onrender.com';
    await db.collection('mcp_settings').updateOne(
      { serverName: 'ayyuhannas-fest' },
      { $set: { cloudServerUrl: realUrl, updatedAt: new Date() } }
    );
    settings.cloudServerUrl = realUrl;
  }
  return settings;
}

// GET /api/admin/mcp
export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await getOrCreateSettings(db);

    return NextResponse.json({
      success: true,
      settings: {
        serverName: settings.serverName || 'ayyuhannas-fest',
        cloudServerUrl: settings.cloudServerUrl || DEFAULT_SETTINGS.cloudServerUrl,
        masterAuthToken: settings.masterAuthToken || DEFAULT_SETTINGS.masterAuthToken,
        readOnly: settings.readOnly ?? true,
        authorizedEmails: settings.authorizedEmails || [],
        updatedAt: settings.updatedAt || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/mcp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/mcp
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { action } = body;

    const settings = await getOrCreateSettings(db);

    // 1. Action: update_settings
    if (action === 'update_settings') {
      const { cloudServerUrl, masterAuthToken, readOnly } = body;
      const updates: any = { updatedAt: new Date() };

      if (typeof cloudServerUrl === 'string') updates.cloudServerUrl = cloudServerUrl.trim();
      if (typeof masterAuthToken === 'string') updates.masterAuthToken = masterAuthToken.trim();
      if (typeof readOnly === 'boolean') updates.readOnly = readOnly;

      await db.collection('mcp_settings').updateOne(
        { serverName: 'ayyuhannas-fest' },
        { $set: updates }
      );

      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    }

    // 2. Action: add_user
    if (action === 'add_user') {
      const { email, name, role = 'viewer' } = body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ success: false, error: 'A valid email address is required' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingList: McpAuthorizedUser[] = settings.authorizedEmails || [];

      if (existingList.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json({ success: false, error: 'This email is already in the authorized list' }, { status: 400 });
      }

      const userToken = `ayyu_${randomBytes(16).toString('hex')}`;
      const newUser: McpAuthorizedUser = {
        id: `mcp_user_${Date.now()}_${randomBytes(4).toString('hex')}`,
        email: cleanEmail,
        name: (name && String(name).trim()) || cleanEmail.split('@')[0],
        token: userToken,
        status: 'active',
        role: role === 'admin' ? 'admin' : 'viewer',
        createdAt: new Date().toISOString(),
      };

      await db.collection('mcp_settings').updateOne(
        { serverName: 'ayyuhannas-fest' },
        {
          $push: { authorizedEmails: newUser } as any,
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Authorized ${cleanEmail} successfully`,
        user: newUser,
      });
    }

    // 3. Action: ping_server
    if (action === 'ping_server') {
      const targetUrl = body.url || settings.cloudServerUrl;
      const startTime = Date.now();

      try {
        const cleanUrl = targetUrl.replace(/\/+$/, '');
        // Allow up to 25s for Render free tier instances to spin up on cold start
        const response = await fetch(`${cleanUrl}/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(25000),
        });

        const latency = Date.now() - startTime;
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            status: 'online',
            latencyMs: latency,
            data,
          });
        }

        return NextResponse.json({
          success: false,
          status: 'error',
          statusCode: response.status,
          latencyMs: latency,
          error: `Server responded with HTTP ${response.status}`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          status: 'offline',
          latencyMs: Date.now() - startTime,
          error: err.message || 'Could not connect to MCP server URL',
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/mcp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/mcp
export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { action, userId, status } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // 1. Action: toggle_status
    if (action === 'toggle_status') {
      const newStatus = status === 'revoked' ? 'revoked' : 'active';
      const result = await db.collection('mcp_settings').updateOne(
        { serverName: 'ayyuhannas-fest', 'authorizedEmails.id': userId },
        {
          $set: {
            'authorizedEmails.$.status': newStatus,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: `Access set to ${newStatus}` });
    }

    // 2. Action: regenerate_token
    if (action === 'regenerate_token') {
      const newToken = `ayyu_${randomBytes(16).toString('hex')}`;
      const result = await db.collection('mcp_settings').updateOne(
        { serverName: 'ayyuhannas-fest', 'authorizedEmails.id': userId },
        {
          $set: {
            'authorizedEmails.$.token': newToken,
            'authorizedEmails.$.status': 'active',
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, newToken });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/mcp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/mcp
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId parameter' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('mcp_settings').updateOne(
      { serverName: 'ayyuhannas-fest' },
      {
        $pull: { authorizedEmails: { id: userId } } as any,
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User removed from authorized list' });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/mcp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
