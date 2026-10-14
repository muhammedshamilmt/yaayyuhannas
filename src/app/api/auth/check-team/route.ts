import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';
import { isAdminEmail } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const { email, teamCode } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if it's a main admin email first
    if (isAdminEmail(cleanEmail)) {
      return NextResponse.json({
        success: true,
        userType: 'admin',
        team: null
      });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`(^|[,;\\s])${escapedEmail}([,;\\s]|$)`, 'i');

    const teamFilter = { 
      $or: [
        { adminEmails: cleanEmail },
        { adminEmails: { $regex: emailRegex } },
        { captainEmail: cleanEmail },
        { captainEmail: { $regex: emailRegex } },
        { leaders: cleanEmail },
        { leaders: { $regex: emailRegex } }
      ]
    };

    // Find ALL matching teams for this email
    const matchingTeams = await collection.find(teamFilter).toArray();

    if (matchingTeams.length === 0) {
      // If no match found, return regular user
      return NextResponse.json({
        success: true,
        userType: 'user',
        team: null
      });
    }

    // Filter to teams where this email has ACTIVE access (not revoked in disabledAdminEmails)
    const activeTeams = matchingTeams.filter(team => {
      const disabledEmails = Array.isArray(team.disabledAdminEmails)
        ? team.disabledAdminEmails.map(e => e.trim().toLowerCase())
        : [];
      return !disabledEmails.includes(cleanEmail);
    });

    if (activeTeams.length > 0) {
      // Determine best team:
      // 1. If teamCode is provided, check if it matches one of the active teams
      let chosenTeam: Team | undefined;
      if (teamCode) {
        const cleanTeamCode = String(teamCode).trim().toUpperCase();
        chosenTeam = activeTeams.find(t => t.code?.toUpperCase() === cleanTeamCode);
      }

      // 2. Otherwise prioritize team with festId, or the first active team
      if (!chosenTeam) {
        chosenTeam = activeTeams.find(t => t.festId) || activeTeams[0];
      }

      const adminEmails = Array.isArray(chosenTeam.adminEmails)
        ? [...chosenTeam.adminEmails]
        : chosenTeam.adminEmails
        ? [chosenTeam.adminEmails]
        : [];
      if (chosenTeam.captainEmail && !adminEmails.some(e => e.toLowerCase() === chosenTeam.captainEmail?.toLowerCase())) {
        adminEmails.unshift(chosenTeam.captainEmail);
      }

      return NextResponse.json({
        success: true,
        userType: 'team-captain',
        team: {
          _id: chosenTeam._id,
          code: chosenTeam.code,
          name: chosenTeam.name,
          color: chosenTeam.color,
          description: chosenTeam.description,
          captain: chosenTeam.captain,
          captainEmail: chosenTeam.captainEmail,
          adminEmails: Array.from(new Set(adminEmails)),
          disabledAdminEmails: chosenTeam.disabledAdminEmails || []
        }
      });
    }

    // If matching teams were found, but ALL of them have disabled/revoked access for this email:
    return NextResponse.json({
      success: true,
      userType: 'user',
      accessDisabled: true,
      team: null,
      message: 'Team admin access has been revoked for this email.'
    });
    
  } catch (error) {
    console.error('Error checking team membership:', error);
    return NextResponse.json({ error: 'Failed to check team membership' }, { status: 500 });
  }
}