import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';
import { isAdminEmail } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if it's a main admin email first
    if (isAdminEmail(email)) {
      return NextResponse.json({
        success: true,
        userType: 'admin',
        team: null
      });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    // Check if email matches any team admin email, captain email, or leaders
    const team = await collection.findOne({ 
      $or: [
        { adminEmails: { $regex: emailRegex } },
        { captainEmail: { $regex: emailRegex } },
        { leaders: { $regex: emailRegex } }
      ]
    });
    
    if (team) {
      return NextResponse.json({
        success: true,
        userType: 'team-captain',
        team: {
          _id: team._id,
          code: team.code,
          name: team.name,
          color: team.color,
          description: team.description,
          captain: team.captain,
          captainEmail: team.captainEmail,
          adminEmails: team.adminEmails || (team.captainEmail ? [team.captainEmail] : [])
        }
      });
    }
    
    // If no match found, return regular user
    return NextResponse.json({
      success: true,
      userType: 'user',
      team: null
    });
    
  } catch (error) {
    console.error('Error checking team membership:', error);
    return NextResponse.json({ error: 'Failed to check team membership' }, { status: 500 });
  }
}