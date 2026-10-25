import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { findProgramme, getProgrammeName, getProgrammeCode, getDefaultGradePoints } from '@/lib/resultsHelper';

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

export type ProgrammeGroupType = 'sports' | 'arts-stage' | 'arts-non-stage';

/**
 * Accurately classifies a programme into 'sports', 'arts-stage', or 'arts-non-stage'
 */
export function classifyProgramme(
  programme?: Programme | null,
  code?: string,
  name?: string,
  category?: string
): { category: 'arts' | 'sports'; subcategory: 'stage' | 'non-stage'; programmeType: ProgrammeGroupType; isStage: boolean } {
  const officialCategory = (programme?.category || category || '').trim().toLowerCase();
  const officialSubcategory = (programme?.subcategory || '').trim().toLowerCase();
  const cleanCode = (code || programme?.code || '').trim().toUpperCase();
  const cleanName = (name || programme?.name || '').trim().toLowerCase();

  // 1. If officialCategory is explicitly provided by the programme document:
  if (officialCategory === 'sports') {
    return {
      category: 'sports',
      subcategory: 'non-stage',
      programmeType: 'sports',
      isStage: false
    };
  }

  if (officialCategory === 'arts') {
    const isNonStage = 
      officialSubcategory === 'non-stage' ||
      cleanCode.startsWith('ANS') ||
      cleanCode.startsWith('BNS') ||
      cleanCode.startsWith('JNS') ||
      cleanCode.startsWith('SNS');

    if (isNonStage) {
      return {
        category: 'arts',
        subcategory: 'non-stage',
        programmeType: 'arts-non-stage',
        isStage: false
      };
    }

    return {
      category: 'arts',
      subcategory: 'stage',
      programmeType: 'arts-stage',
      isStage: true
    };
  }

  // 2. Fallback when officialCategory is not available (e.g., ad-hoc registration)
  const isSportsKeyword = 
    cleanCode.startsWith('TNS') || // TNS250 Glass Blowing
    cleanName.includes('cricket') ||
    cleanName.includes('football') ||
    cleanName.includes('volly') ||
    cleanName.includes('volleyball') ||
    cleanName.includes('tug of war') ||
    cleanName.includes('badminton') ||
    cleanName.includes('pot breaking') ||
    cleanName.includes('plate spinner') ||
    cleanName.includes('water balloon') ||
    cleanName.includes('leg chain') ||
    cleanName.includes('frog jump') ||
    cleanName.includes('chess') ||
    cleanName.includes('freestyle') ||
    cleanName.includes('penalty') ||
    cleanName.includes('shootout') ||
    cleanName.includes('glass blowing') ||
    cleanName.includes('glass balance') ||
    cleanName.includes('pull ups') ||
    cleanName.includes('arm wrestling') ||
    cleanName.includes('race') ||
    cleanName.includes('running');

  if (isSportsKeyword) {
    return {
      category: 'sports',
      subcategory: 'non-stage',
      programmeType: 'sports',
      isStage: false
    };
  }

  const isNonStageArts = 
    cleanCode.startsWith('ANS') ||
    cleanCode.startsWith('BNS') ||
    cleanCode.startsWith('JNS') ||
    cleanCode.startsWith('SNS') ||
    cleanName.includes('essay') ||
    cleanName.includes('writing') ||
    cleanName.includes('drawing') ||
    cleanName.includes('painting') ||
    cleanName.includes('typing') ||
    cleanName.includes('calligraphy') ||
    cleanName.includes('story') ||
    cleanName.includes('reporting') ||
    cleanName.includes('poster') ||
    cleanName.includes('translation') ||
    cleanName.includes('heading');

  if (isNonStageArts) {
    return {
      category: 'arts',
      subcategory: 'non-stage',
      programmeType: 'arts-non-stage',
      isStage: false
    };
  }

  // 3. Default fallback: Arts Stage
  return {
    category: 'arts',
    subcategory: 'stage',
    programmeType: 'arts-stage',
    isStage: true
  };
}

export interface CandidateResultDetail {
  result: Result;
  programmeName: string;
  programmeCode: string;
  category: string;
  position: 1 | 2 | 3 | 0; // 0 = participation grade only
  positionPoints: number;
  grade?: string;
  gradePoints: number;
  totalPoints: number;
  date?: string;
}

export interface CandidateRegisteredProgramme {
  participantRecord?: ProgrammeParticipant;
  programme?: Programme;
  programmeName: string;
  programmeCode: string;
  category: 'arts' | 'sports';
  subcategory?: 'stage' | 'non-stage';
  programmeType: ProgrammeGroupType;
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

  // Process all results for this candidate
  results.forEach(result => {
    const isFirst = result.firstPlace?.some(p => String(p.chestNumber || '').trim() === chest);
    const isSecond = result.secondPlace?.some(p => String(p.chestNumber || '').trim() === chest);
    const isThird = result.thirdPlace?.some(p => String(p.chestNumber || '').trim() === chest);
    const gradeItem = result.participationGrades?.find(p => String(p.chestNumber || '').trim() === chest);

    if (!isFirst && !isSecond && !isThird && !gradeItem) {
      return;
    }

    let pos: 1 | 2 | 3 | 0 = 0;
    let posPts = 0;
    let earnedGrade: string | undefined = undefined;

    if (isFirst) {
      pos = 1;
      posPts = Number(result.firstPoints) || 0;
      gold++;
      earnedGrade = result.firstPlace?.find(p => String(p.chestNumber || '').trim() === chest)?.grade;
    } else if (isSecond) {
      pos = 2;
      posPts = Number(result.secondPoints) || 0;
      silver++;
      earnedGrade = result.secondPlace?.find(p => String(p.chestNumber || '').trim() === chest)?.grade;
    } else if (isThird) {
      pos = 3;
      posPts = Number(result.thirdPoints) || 0;
      bronze++;
      earnedGrade = result.thirdPlace?.find(p => String(p.chestNumber || '').trim() === chest)?.grade;
    }

    let gPts = 0;
    if (gradeItem) {
      earnedGrade = gradeItem.grade || earnedGrade;
      gPts = Number(gradeItem.points ?? result.participationPoints ?? getDefaultGradePoints(gradeItem.grade));
    }

    const eventPoints = posPts + gPts;
    positionPoints += posPts;
    gradePoints += gPts;
    totalPoints += eventPoints;

    const matchedProg = findProgramme(result, programmes);
    let pName = getProgrammeName(result, matchedProg);
    let pCode = getProgrammeCode(result, matchedProg);

    if (!pName || pName === 'Unknown Programme') {
      if (result.programme) {
        pName = result.programme.includes(' - ') ? result.programme.split(' - ').slice(1).join(' - ').trim() : result.programme.trim();
      } else if (pCode) {
        pName = `Event ${pCode}`;
      } else {
        pName = 'Festival Event';
      }
    }

    const classification = classifyProgramme(matchedProg, pCode, pName, result.section);

    const dateVal = result.publishedAt || result.createdAt;
    const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    resultDetails.push({
      result,
      programmeName: pName,
      programmeCode: pCode,
      category: classification.category,
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

  // Find all registered programmes for this candidate from programme_participants
  const registeredProgrammes: CandidateRegisteredProgramme[] = [];
  const registeredProgCodes = new Set<string>();

  programmeParticipants.forEach(pp => {
    const hasCandidate = (pp.participants || []).some(pChest => String(pChest || '').trim() === chest);
    if (!hasCandidate) return;

    const cleanPpCode = (pp.programmeCode || '').trim();
    const cleanPpName = (pp.programmeName || '').trim();
    const cleanPpId = (pp.programmeId || '').trim();

    // Priority 1: Exact programmeId match (CRITICAL: prevents cross-code collisions)
    let matchedProg: Programme | undefined = undefined;
    if (cleanPpId) {
      matchedProg = programmes.find(p => String(p._id || p.id || '').trim() === cleanPpId);
    }

    // Priority 2: Match by BOTH code and name
    if (!matchedProg && cleanPpCode && cleanPpName) {
      matchedProg = programmes.find(p => 
        (p.code || '').trim().toLowerCase() === cleanPpCode.toLowerCase() &&
        (p.name || '').trim().toLowerCase() === cleanPpName.toLowerCase()
      );
    }

    // Priority 3: Match by name
    if (!matchedProg && cleanPpName) {
      matchedProg = programmes.find(p => 
        (p.name || '').trim().toLowerCase() === cleanPpName.toLowerCase()
      );
    }

    // Priority 4: Match by code only (fallback)
    if (!matchedProg && cleanPpCode) {
      matchedProg = programmes.find(p => 
        (p.code || '').trim().toLowerCase() === cleanPpCode.toLowerCase()
      );
    }

    let progName = (matchedProg?.name || cleanPpName).trim();
    if (!progName || progName.toLowerCase() === 'programme' || progName.toLowerCase() === 'unknown') {
      progName = cleanPpCode ? `Event ${cleanPpCode}` : 'Festival Programme';
    }

    const progCode = (matchedProg?.code || cleanPpCode).trim();
    const classification = classifyProgramme(matchedProg, progCode, progName, matchedProg?.category);
    const section = matchedProg?.section || candidate.section || 'general';

    // Check if this registered programme already has an announced result
    const matchedResult = resultDetails.find(rd => {
      if (cleanPpId && String(rd.result.programmeId || '').trim() === cleanPpId) return true;
      if (progCode && rd.programmeCode && rd.programmeCode.toLowerCase() === progCode.toLowerCase()) return true;
      if (progCode && rd.result.programme && rd.result.programme.toLowerCase().includes(progCode.toLowerCase())) return true;
      if (cleanPpName && rd.programmeName && rd.programmeName.toLowerCase() === cleanPpName.toLowerCase()) return true;
      return false;
    });

    if (progCode) {
      registeredProgCodes.add(progCode.toLowerCase());
    }

    registeredProgrammes.push({
      participantRecord: pp,
      programme: matchedProg,
      programmeName: progName,
      programmeCode: progCode,
      category: classification.category,
      subcategory: classification.subcategory,
      programmeType: classification.programmeType,
      section,
      isStage: classification.isStage,
      hasResult: !!matchedResult,
      resultDetail: matchedResult
    });
  });

  // Also include any result event where candidate scored points that might not be in programme_participants
  resultDetails.forEach(rd => {
    const codeMatch = rd.programmeCode ? registeredProgCodes.has(rd.programmeCode.toLowerCase()) : false;
    const nameMatch = registeredProgrammes.some(rp => rp.programmeName.toLowerCase() === rd.programmeName.toLowerCase());

    if (!codeMatch && !nameMatch) {
      const matchedProg = findProgramme(rd.result, programmes);
      const classification = classifyProgramme(matchedProg, rd.programmeCode, rd.programmeName, rd.category);

      registeredProgrammes.push({
        programme: matchedProg,
        programmeName: rd.programmeName,
        programmeCode: rd.programmeCode || (matchedProg?.code || '').trim(),
        category: classification.category,
        subcategory: classification.subcategory,
        programmeType: classification.programmeType,
        section: candidate.section || 'general',
        isStage: classification.isStage,
        hasResult: true,
        resultDetail: rd
      });
      if (rd.programmeCode) {
        registeredProgCodes.add(rd.programmeCode.toLowerCase());
      }
    }
  });

  const totalWins = gold + silver + bronze;

  let performanceRating: 'Champion' | 'Excellent' | 'Good' | 'Active' | 'Participant' = 'Participant';
  let ratingColor = 'text-gray-700 bg-gray-100 border-gray-200';

  if (gold >= 2 || totalPoints >= 25) {
    performanceRating = 'Champion';
    ratingColor = 'text-amber-800 bg-amber-50 border-amber-300';
  } else if (gold >= 1 || totalPoints >= 15) {
    performanceRating = 'Excellent';
    ratingColor = 'text-emerald-800 bg-emerald-50 border-emerald-300';
  } else if (totalWins >= 1 || totalPoints >= 8) {
    performanceRating = 'Good';
    ratingColor = 'text-blue-800 bg-blue-50 border-blue-300';
  } else if (registeredProgrammes.length >= 2 || totalPoints > 0) {
    performanceRating = 'Active';
    ratingColor = 'text-indigo-800 bg-indigo-50 border-indigo-300';
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
