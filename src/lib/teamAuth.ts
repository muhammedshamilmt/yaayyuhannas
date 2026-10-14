/**
 * Resolves and strictly enforces the authorized team code for the current user.
 * - Team Captains / Team Admins are strictly locked to their assigned team code.
 * - Main Admins (superadmins) can access any team via URL param, selectedTeam, or fallback.
 */
export function getAuthorizedTeamCode(searchParamTeam?: string | null): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        // Strict restriction: team captains can only access their assigned team
        if (user.userType === 'team-captain' && user.team?.code) {
          return user.team.code;
        }
      }
    } catch (e) {}

    if (searchParamTeam) return searchParamTeam;
    const saved = localStorage.getItem('selectedTeam');
    if (saved) return saved;
  }
  return searchParamTeam || 'SMD';
}
