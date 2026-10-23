import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { findProgramme, getProgrammeName } from '@/lib/resultsHelper';

export interface TeamTheme {
  code: string;
  name: string;
  color: string;
  badgeBg: string;
  tagBg: string;
  gradient: string;
  lightGradient: string;
  ringColor: string;
  textColor: string;
  borderColor: string;
}

export function getTeamTheme(teamCodeOrName?: string, teams: Team[] = []): TeamTheme {
  const clean = (teamCodeOrName || '').trim();
  const matchedTeam = teams.find(t => 
    t.code?.toLowerCase() === clean.toLowerCase() || 
    t.name?.toLowerCase() === clean.toLowerCase() ||
    t._id?.toString() === clean
  );

  const code = (matchedTeam?.code || clean).toUpperCase();
  const name = matchedTeam?.name || (
    code === 'ADL' ? 'ADĀLAH' :
    code === 'SHJ' ? 'SHAJĀʿAH' :
    code === 'QIY' || code === 'QYD' ? 'QIYĀDAH' :
    clean || 'Unknown Team'
  );

  const lowerName = name.toLowerCase();

  // ADĀLAH (Blue)
  if (code === 'ADL' || lowerName.includes('adāl') || lowerName.includes('adal') || lowerName.includes('adalah')) {
    return {
      code: 'ADL',
      name: 'ADĀLAH',
      color: '#3B82F6',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      tagBg: 'bg-blue-600 text-white',
      gradient: 'from-blue-600 via-blue-700 to-indigo-800',
      lightGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      ringColor: 'ring-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500'
    };
  }

  // SHAJĀʿAH (Red)
  if (code === 'SHJ' || lowerName.includes('shaj') || lowerName.includes('shajā') || lowerName.includes('shajaah')) {
    return {
      code: 'SHJ',
      name: 'SHAJĀʿAH',
      color: '#EF4444',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      tagBg: 'bg-red-600 text-white',
      gradient: 'from-red-600 via-rose-700 to-red-800',
      lightGradient: 'from-red-500/10 via-red-500/5 to-transparent',
      ringColor: 'ring-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-red-500'
    };
  }

  // QIYĀDAH (Green)
  if (code === 'QIY' || code === 'QYD' || lowerName.includes('qiya') || lowerName.includes('qiyā') || lowerName.includes('qiyadah')) {
    return {
      code: 'QIY',
      name: 'QIYĀDAH',
      color: '#22C55E',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tagBg: 'bg-emerald-600 text-white',
      gradient: 'from-emerald-600 via-green-700 to-teal-800',
      lightGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      ringColor: 'ring-emerald-500',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-500'
    };
  }

  // Fallback
  return {
    code: code || 'UNKNOWN',
    name: name,
    color: matchedTeam?.color || '#6366F1',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tagBg: 'bg-indigo-600 text-white',
    gradient: 'from-indigo-600 via-purple-700 to-violet-800',
    lightGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    ringColor: 'ring-indigo-500',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500'
  };
}

export function getSectionTheme(section?: string) {
  switch (section?.toLowerCase()) {
    case 'senior':
      return {
        label: 'Senior',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        textColor: 'text-purple-700'
      };
    case 'junior':
      return {
        label: 'Junior',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        textColor: 'text-amber-700'
      };
    case 'sub-junior':
    case 'subjunior':
      return {
        label: 'Sub-Junior',
        badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
        textColor: 'text-pink-700'
      };
    case 'general':
      return {
        label: 'General',
        badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        textColor: 'text-cyan-700'
      };
    default:
      return {
        label: section || 'General',
        badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
        textColor: 'text-gray-700'
      };
  }
}

export interface CandidateResultDetail {
  result: Result;
  programmeName: string;
  category: string;
  position: 1 | 2 | 3 | 0; // 0 = participation grade only
  positionPoints: number;
  grade?: string;
  gradePoints: number;
  totalPoints: number;
  date?: string;
}

export interface CandidateRegisteredProgramme {
  participantRecord: ProgrammeParticipant;
  programme?: Programme;
  programmeName: string;
  programmeCode: string;
  category: string;
  section: string;
  isStage: boolean;
  hasResult: boolean;
  resultDetail?: CandidateResultDetail;
}

export interface CandidateStats {
  candidate: Candidate;
  totalPoints: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  gradePoints: number;
  positionPoints: number;
  resultDetails: CandidateResultDetail[];
  registeredProgrammes: CandidateRegisteredProgramme[];
  performanceRating: 'Champion' | 'Excellent' | 'Good' | 'Active' | 'Participant';
  ratingColor: string;
}

export function getCandidateStats(
  candidate: Candidate,
  results: Result[] = [],
  programmeParticipants: ProgrammeParticipant[] = [],
  programmes: Programme[] = []
): CandidateStats {
  const chest = String(candidate.chestNumber || '').trim();
  const resultDetails: CandidateResultDetail[] = [];

  let totalPoints = 0;
  let gold = 0;
  let silver = 0;
  let bronze = 0;
  let positionPoints = 0;
  let gradePoints = 0;

  results.forEach(result => {
    const isFirst = result.firstPlace?.some(p => String(p.chestNumber).trim() === chest);
    const isSecond = result.secondPlace?.some(p => String(p.chestNumber).trim() === chest);
    const isThird = result.thirdPlace?.some(p => String(p.chestNumber).trim() === chest);
    const gradeItem = result.participationGrades?.find(p => String(p.chestNumber).trim() === chest);

    if (!isFirst && !isSecond && !isThird && !gradeItem) {
      return;
    }

    let pos: 1 | 2 | 3 | 0 = 0;
    let posPts = 0;
    let earnedGrade: string | undefined = undefined;

    if (isFirst) {
      pos = 1;
      posPts = result.firstPoints ?? 0;
      gold++;
      earnedGrade = result.firstPlace?.find(p => String(p.chestNumber).trim() === chest)?.grade;
    } else if (isSecond) {
      pos = 2;
      posPts = result.secondPoints ?? 0;
      silver++;
      earnedGrade = result.secondPlace?.find(p => String(p.chestNumber).trim() === chest)?.grade;
    } else if (isThird) {
      pos = 3;
      posPts = result.thirdPoints ?? 0;
      bronze++;
      earnedGrade = result.thirdPlace?.find(p => String(p.chestNumber).trim() === chest)?.grade;
    }

    let gPts = 0;
    if (gradeItem) {
      earnedGrade = gradeItem.grade || earnedGrade;
      gPts = Number(gradeItem.points ?? result.participationPoints ?? 0);
    }

    const eventPoints = posPts + gPts;
    positionPoints += posPts;
    gradePoints += gPts;
    totalPoints += eventPoints;

    const matchedProg = findProgramme(result, programmes);
    const pName = getProgrammeName(result, matchedProg);
    const cat = matchedProg?.category || 'general';

    const dateVal = result.publishedAt || result.createdAt;
    const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    resultDetails.push({
      result,
      programmeName: pName,
      category: cat,
      position: pos,
      positionPoints: posPts,
      grade: earnedGrade,
      gradePoints: gPts,
      totalPoints: eventPoints,
      date: dateStr
    });
  });

  // Sort results by date descending (latest first)
  resultDetails.sort((a, b) => {
    const timeA = new Date(a.result.publishedAt || a.result.createdAt || 0).getTime();
    const timeB = new Date(b.result.publishedAt || b.result.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Find all registered programmes for this candidate
  const registeredProgrammes: CandidateRegisteredProgramme[] = [];
  programmeParticipants.forEach(pp => {
    const hasCandidate = (pp.participants || []).some(pChest => String(pChest).trim() === chest);
    if (!hasCandidate) return;

    // Find full programme info
    const matchedProg = programmes.find(p => 
      (pp.programmeId && (String(p._id) === String(pp.programmeId) || String(p.id) === String(pp.programmeId))) ||
      (pp.programmeCode && p.code?.trim().toLowerCase() === pp.programmeCode?.trim().toLowerCase())
    );

    const progName = matchedProg?.name || pp.programmeName || 'Programme';
    const progCode = matchedProg?.code || pp.programmeCode || '';
    const category = matchedProg?.category || 'arts';
    const section = matchedProg?.section || candidate.section || 'general';
    const isStage = matchedProg?.isStage ?? true;

    // Check if this registered programme already has a result
    const matchedResult = resultDetails.find(rd => {
      if (pp.programmeId && String(rd.result.programmeId) === String(pp.programmeId)) return true;
      if (progCode && rd.result.programme?.toLowerCase().includes(progCode.toLowerCase())) return true;
      return false;
    });

    registeredProgrammes.push({
      participantRecord: pp,
      programme: matchedProg,
      programmeName: progName,
      programmeCode: progCode,
      category,
      section,
      isStage,
      hasResult: !!matchedResult,
      resultDetail: matchedResult
    });
  });

  const totalWins = gold + silver + bronze;

  let performanceRating: 'Champion' | 'Excellent' | 'Good' | 'Active' | 'Participant' = 'Participant';
  let ratingColor = 'text-gray-600 bg-gray-100 border-gray-200';

  if (gold >= 2 || totalPoints >= 25) {
    performanceRating = 'Champion';
    ratingColor = 'text-amber-700 bg-amber-50 border-amber-300';
  } else if (gold >= 1 || totalPoints >= 15) {
    performanceRating = 'Excellent';
    ratingColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  } else if (totalWins >= 1 || totalPoints >= 8) {
    performanceRating = 'Good';
    ratingColor = 'text-blue-700 bg-blue-50 border-blue-300';
  } else if (registeredProgrammes.length >= 2 || totalPoints > 0) {
    performanceRating = 'Active';
    ratingColor = 'text-indigo-700 bg-indigo-50 border-indigo-300';
  }

  return {
    candidate,
    totalPoints,
    medals: {
      gold,
      silver,
      bronze,
      total: totalWins
    },
    gradePoints,
    positionPoints,
    resultDetails,
    registeredProgrammes,
    performanceRating,
    ratingColor
  };
}
