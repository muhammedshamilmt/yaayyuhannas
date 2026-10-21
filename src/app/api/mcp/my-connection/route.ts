import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { isAdminEmail } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { authorized: false, error: 'A valid email address is required to check authorization' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDatabase();
    const settings = await db.collection('mcp_settings').findOne({ serverName: 'ayyuhannas-fest' });

    const cloudServerUrl = settings?.cloudServerUrl || 'https://yaayyuhannas.onrender.com';
    const cleanUrl = cloudServerUrl.replace(/\/+$/, '');

    // 1. Check if user is a Super Admin
    if (isAdminEmail(cleanEmail)) {
      const token = settings?.masterAuthToken || 'ayyuhannas-secret-2026';
      return NextResponse.json({
        authorized: true,
        role: 'admin',
        email: cleanEmail,
        serverName: 'ayyuhannas-fest',
        cloudServerUrl: cleanUrl,
        token,
        sseUrl: `${cleanUrl}/sse?token=${token}`,
        clientConfigs: {
          cursor: {
            mcpServers: {
              'ayyuhannas-fest': {
                url: `${cleanUrl}/sse?token=${token}`,
              },
            },
          },
          claudeDesktop: {
            mcpServers: {
              'ayyuhannas-fest': {
                url: `${cleanUrl}/sse`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          },
        },
      });
    }

    // 2. Check in Whitelisted Authorized Emails
    const authorizedList = settings?.authorizedEmails || [];
    const matchedUser = authorizedList.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      return NextResponse.json(
        {
          authorized: false,
          email: cleanEmail,
          error: `Access Denied: "${cleanEmail}" is not authorized to connect to the ayyuhannas-fest database. Please ask the festival administrator to add your email.`,
        },
        { status: 403 }
      );
    }

    if (matchedUser.status === 'revoked') {
      return NextResponse.json(
        {
          authorized: false,
          email: cleanEmail,
          error: `Access Revoked: Authorization for "${cleanEmail}" was suspended by the festival administrator.`,
        },
        { status: 403 }
      );
    }

    const token = matchedUser.token;
    return NextResponse.json({
      authorized: true,
      role: matchedUser.role || 'viewer',
      name: matchedUser.name,
      email: cleanEmail,
      serverName: 'ayyuhannas-fest',
      cloudServerUrl: cleanUrl,
      token,
      sseUrl: `${cleanUrl}/sse?token=${token}`,
      clientConfigs: {
        cursor: {
          mcpServers: {
            'ayyuhannas-fest': {
              url: `${cleanUrl}/sse?token=${token}`,
            },
          },
        },
        claudeDesktop: {
          mcpServers: {
            'ayyuhannas-fest': {
              url: `${cleanUrl}/sse`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/mcp/my-connection:', error);
    return NextResponse.json({ authorized: false, error: error.message }, { status: 500 });
  }
}
