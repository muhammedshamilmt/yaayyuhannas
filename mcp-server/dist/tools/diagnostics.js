import { getDatabase } from '../db.js';
export function registerDiagnosticsTools(server) {
    // Tool: diagnose_database_anomalies
    server.tool('diagnose_database_anomalies', 'Scans the database for data integrity problems: duplicate chest numbers, orphaned registrations, missing teams, and festival rule violations.', {}, async () => {
        try {
            const db = await getDatabase();
            const [candidates, programmes, participants, results, teams] = await Promise.all([
                db.collection('candidates').find({}).toArray(),
                db.collection('programmes').find({}).toArray(),
                db.collection('programme_participants').find({}).toArray(),
                db.collection('results').find({}).toArray(),
                db.collection('teams').find({}).toArray(),
            ]);
            const anomalies = {
                duplicateChestNumbers: [],
                unassignedCandidatesCount: 0,
                unassignedCandidateNames: [],
                orphanedRegistrations: [],
                invalidTeamCodes: [],
                juniorSongRuleViolations: [],
            };
            // 1. Check duplicate chest numbers
            const chestMap = new Map();
            for (const c of candidates) {
                if (c.chestNumber) {
                    const count = (chestMap.get(c.chestNumber) || 0) + 1;
                    chestMap.set(c.chestNumber, count);
                }
            }
            for (const [chest, count] of chestMap.entries()) {
                if (count > 1) {
                    anomalies.duplicateChestNumbers.push(`${chest} (appears ${count} times)`);
                }
            }
            // 2. Check unassigned candidates
            const unassigned = candidates.filter((c) => !c.team || c.team.trim() === '');
            anomalies.unassignedCandidatesCount = unassigned.length;
            anomalies.unassignedCandidateNames = unassigned.slice(0, 10).map((c) => `${c.name} (${c.chestNumber || 'No Chest'})`);
            // 3. Valid team codes
            const validTeamCodes = new Set(teams.map((t) => t.code?.toUpperCase()));
            for (const c of candidates) {
                if (c.team && !validTeamCodes.has(c.team.toUpperCase())) {
                    anomalies.invalidTeamCodes.push(`Candidate #${c.chestNumber} assigned to unknown team: ${c.team}`);
                }
            }
            // 4. Orphaned registrations
            const progCodes = new Set(programmes.map((p) => p.code?.toUpperCase()));
            for (const part of participants) {
                if (part.programmeCode && !progCodes.has(part.programmeCode.toUpperCase())) {
                    anomalies.orphanedRegistrations.push(`Registration references non-existent programme code: ${part.programmeCode}`);
                }
            }
            // 5. Junior max 4 songs violation check
            const songProgCodes = new Set(programmes
                .filter((p) => {
                const name = (p.name || '').toLowerCase();
                return (name.includes('song') ||
                    name.includes('ganam') ||
                    name.includes('pattu') ||
                    name.includes('madh') ||
                    name.includes('geetham') ||
                    name.includes('recitation'));
            })
                .map((p) => p.code?.toUpperCase()));
            const juniorCandidates = candidates.filter((c) => (c.section || '').toLowerCase() === 'junior');
            const candidateSongCount = new Map();
            for (const part of participants) {
                if (songProgCodes.has((part.programmeCode || '').toUpperCase())) {
                    for (const ch of part.participants || []) {
                        candidateSongCount.set(ch, (candidateSongCount.get(ch) || 0) + 1);
                    }
                }
            }
            for (const jc of juniorCandidates) {
                const songs = candidateSongCount.get(jc.chestNumber) || 0;
                if (songs > 4) {
                    anomalies.juniorSongRuleViolations.push({
                        chestNumber: jc.chestNumber,
                        candidateName: jc.name,
                        songCount: songs,
                    });
                }
            }
            const isClean = anomalies.duplicateChestNumbers.length === 0 &&
                anomalies.unassignedCandidatesCount === 0 &&
                anomalies.orphanedRegistrations.length === 0 &&
                anomalies.invalidTeamCodes.length === 0 &&
                anomalies.juniorSongRuleViolations.length === 0;
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            overallHealth: isClean ? 'HEALTHY' : 'ANOMALIES_DETECTED',
                            totalCandidatesChecked: candidates.length,
                            totalProgrammesChecked: programmes.length,
                            totalRegistrationsChecked: participants.length,
                            anomalies,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Diagnostic execution error: ${error.message}` }],
            };
        }
    });
}
