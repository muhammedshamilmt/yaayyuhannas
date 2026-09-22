import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    // Check if email matches any team captain email or leaders
    const team = await collection.findOne({ 
      $or: [
        { captainEmail: { $regex: new RegExp(`^${email}$`, 'i') } },
        { leaders: { $regex: new RegExp(`^${email}$`, 'i') } }
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
          captainEmail: team.captainEmail
        }
      });
    }
    
    // Check if it's the admin email
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'dawafest@gmail.com';
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      return NextResponse.json({
        success: true,
        userType: 'admin',
        team: null
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