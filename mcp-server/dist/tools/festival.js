import { z } from 'zod';
import { getDatabase } from '../db.js';
export function registerFestivalTools(server) {
    // Tool: get_festival_overview
    server.tool('get_festival_overview', 'Provides a high-level summary of the festival: active edition, counts of teams, candidates, programmes, completed results, and leader.', {}, async () => {
        try {
            const db = await getDatabase();
            const [activeFest, totalTeams, totalCandidates, totalProgrammes, totalResults, teams] = await Promise.all([
                db.collection('fests').findOne({ status: 'active' }),
                db.collection('teams').countDocuments(),
                db.collection('candidates').countDocuments(),
                db.collection('programmes').countDocuments(),
                db.collection('results').countDocuments({ status: { $ne: 'draft' } }),
                db.collection('teams').find({}).sort({ points: -1 }).toArray(),
            ]);
            const topTeams = teams.slice(0, 3).map((t, idx) => ({
                rank: idx + 1,
                name: t.name,
                code: t.code,
                points: t.points || 0,
                color: t.color,
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            festival: activeFest ? { name: activeFest.name, year: activeFest.year, status: activeFest.status } : 'Default Fest',
                            stats: {
                                totalTeams,
                                totalCandidates,
                                totalProgrammes,
                                completedAndPublishedResults: totalResults,
                                progressPercentage: totalProgrammes > 0 ? `${Math.round((totalResults / totalProgrammes) * 100)}%` : '0%',
                            },
                            topTeams,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to fetch festival overview: ${error.message}` }],
            };
        }
    });
    // Tool: get_live_standings
    server.tool('get_live_standings', 'Calculates and returns live team standings, points, medal counts (Gold, Silver, Bronze), and rankings.', {}, async () => {
        try {
            const db = await getDatabase();
            const [teams, results] = await Promise.all([
                db.collection('teams').find({}).toArray(),
                db.collection('results').find({ status: { $ne: 'draft' } }).toArray(),
            ]);
            // Calculate medals from published results
            const teamMedals = {};
            for (const t of teams) {
                teamMedals[t.code] = { gold: 0, silver: 0, bronze: 0 };
            }
            // Tally medals
            for (const res of results) {
                // Team-based placements
                if (res.firstPlaceTeams) {
                    for (const item of res.firstPlaceTeams) {
                        if (item.teamCode && teamMedals[item.teamCode])
                            teamMedals[item.teamCode].gold++;
                    }
                }
                if (res.secondPlaceTeams) {
                    for (const item of res.secondPlaceTeams) {
                        if (item.teamCode && teamMedals[item.teamCode])
                            teamMedals[item.teamCode].silver++;
                    }
                }
                if (res.thirdPlaceTeams) {
                    for (const item of res.thirdPlaceTeams) {
                        if (item.teamCode && teamMedals[item.teamCode])
                            teamMedals[item.teamCode].bronze++;
                    }
                }
            }
            const sortedTeams = teams
                .map((t) => ({
                code: t.code,
                name: t.name,
                points: t.points || 0,
                members: t.members || 0,
                captain: t.captain,
                color: t.color,
                medals: teamMedals[t.code] || { gold: 0, silver: 0, bronze: 0 },
            }))
                .sort((a, b) => b.points - a.points);
            const rankedStandings = sortedTeams.map((t, index) => ({
                rank: index + 1,
                ...t,
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(rankedStandings, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to calculate standings: ${error.message}` }],
            };
        }
    });
    // Tool: search_candidates
    server.tool('search_candidates', 'Searches for candidates by chest number, name, or team code, returning their registration details and won prizes.', {
        query: z.string().describe('Search term: chest number (e.g., "101"), partial candidate name, or team code'),
        section: z.enum(['all', 'senior', 'junior', 'sub-junior']).optional().default('all').describe('Filter by section'),
        limit: z.number().optional().default(10).describe('Max results to return'),
    }, async ({ query, section, limit }) => {
        try {
            const db = await getDatabase();
            const filter = {};
            const cleanQuery = query.trim();
            filter.$or = [
                { chestNumber: cleanQuery },
                { name: { $regex: cleanQuery, $options: 'i' } },
                { team: cleanQuery.toUpperCase() },
            ];
            if (section && section !== 'all') {
                filter.section = section;
            }
            const candidates = await db.collection('candidates').find(filter).limit(limit || 10).toArray();
            // Enrich with registrations and results
            const enriched = await Promise.all(candidates.map(async (cand) => {
                const [registrations, wonResults] = await Promise.all([
                    db.collection('programme_participants').find({ participants: cand.chestNumber }).toArray(),
                    db.collection('results').find({
                        $or: [
                            { 'firstPlace.chestNumber': cand.chestNumber },
                            { 'secondPlace.chestNumber': cand.chestNumber },
                            { 'thirdPlace.chestNumber': cand.chestNumber },
                            { 'participationGrades.chestNumber': cand.chestNumber },
                        ],
                    }).toArray(),
                ]);
                return {
                    chestNumber: cand.chestNumber,
                    name: cand.name,
                    team: cand.team,
                    section: cand.section,
                    points: cand.points || 0,
                    totalRegistrations: registrations.length,
                    registeredProgrammes: registrations.map((r) => ({
                        programmeCode: r.programmeCode,
                        programmeName: r.programmeName,
                        status: r.status,
                    })),
                    prizesWon: wonResults.map((res) => {
                        let place = 'participation';
                        let grade = '';
                        if (res.firstPlace?.some((p) => p.chestNumber === cand.chestNumber))
                            place = '1st Place';
                        else if (res.secondPlace?.some((p) => p.chestNumber === cand.chestNumber))
                            place = '2nd Place';
                        else if (res.thirdPlace?.some((p) => p.chestNumber === cand.chestNumber))
                            place = '3rd Place';
                        const gradeObj = [
                            ...(res.firstPlace || []),
                            ...(res.secondPlace || []),
                            ...(res.thirdPlace || []),
                            ...(res.participationGrades || []),
                        ].find((p) => p.chestNumber === cand.chestNumber);
                        if (gradeObj && gradeObj.grade)
                            grade = gradeObj.grade;
                        return {
                            programmeId: res.programmeId,
                            place,
                            grade: grade || undefined,
                        };
                    }),
                };
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(enriched, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Search candidate error: ${error.message}` }],
            };
        }
    });
    // Tool: get_programme_details
    server.tool('get_programme_details', 'Gets full details of a competition programme including registered team rosters and published results.', {
        programmeCode: z.string().describe('The programme code (e.g., "AS01", "JS05", "SS10") or programme name'),
    }, async ({ programmeCode }) => {
        try {
            const db = await getDatabase();
            const cleanCode = programmeCode.trim();
            const programme = await db.collection('programmes').findOne({
                $or: [
                    { code: { $regex: `^${cleanCode}$`, $options: 'i' } },
                    { name: { $regex: cleanCode, $options: 'i' } },
                ],
            });
            if (!programme) {
                return {
                    content: [{ type: 'text', text: `Programme matching "${programmeCode}" was not found.` }],
                };
            }
            const progId = programme._id?.toString() || programme.id || programme.code;
            const [participants, result] = await Promise.all([
                db.collection('programme_participants').find({
                    $or: [{ programmeId: progId }, { programmeCode: programme.code }],
                }).toArray(),
                db.collection('results').findOne({
                    $or: [{ programmeId: progId }, { programme: { $regex: programme.code, $options: 'i' } }],
                }),
            ]);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            programme: {
                                code: programme.code,
                                name: programme.name,
                                category: programme.category,
                                subcategory: programme.subcategory,
                                section: programme.section,
                                positionType: programme.positionType,
                                requiredParticipants: programme.requiredParticipants,
                                maxParticipants: programme.maxParticipants,
                                pointsScheme: {
                                    first: programme.firstPoints || 10,
                                    second: programme.secondPoints || 8,
                                    third: programme.thirdPoints || 5,
                                },
                                status: programme.status,
                                isOver: !!programme.isOver,
                            },
                            registeredTeamsCount: participants.length,
                            registeredTeams: participants.map((p) => ({
                                teamCode: p.teamCode,
                                participants: p.participants,
                                status: p.status,
                            })),
                            result: result
                                ? {
                                    status: result.status,
                                    firstPlace: result.firstPlace || result.firstPlaceTeams,
                                    secondPlace: result.secondPlace || result.secondPlaceTeams,
                                    thirdPlace: result.thirdPlace || result.thirdPlaceTeams,
                                    publishedAt: result.publishedAt,
                                }
                                : 'No results recorded yet',
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to fetch programme details: ${error.message}` }],
            };
        }
    });
}
