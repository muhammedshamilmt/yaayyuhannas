import type { FestivalInfo, SectionLimits, SectionRuleConfig, Candidate, Programme, ProgrammeParticipant } from '../types/index';

export const DEFAULT_SECTION_LIMITS: SectionLimits = {
  senior: {
    artsStage: { min: 2, max: 7 },
    artsNonStage: { min: 2, max: 7 },
    sports: { min: 1, max: 4 }
  },
  junior: {
    artsStage: { min: 2, max: 6 },
    artsNonStage: { min: 2, max: 6 },
    sports: { min: 1, max: 4 },
    maxSongs: 4
  },
  'sub-junior': {
    artsStage: { min: 2, max: 5 },
    artsNonStage: { min: 2, max: 5 },
    sports: { min: 1, max: 4 }
  },
  general: {
    artsStage: { min: 0, max: 7 },
    artsNonStage: { min: 0, max: 7 },
    sports: { min: 0, max: 4 }
  }
};

export type ProgrammeTypeKey = 'artsStage' | 'artsNonStage' | 'sports';

/**
 * Normalizes section string to a standard key: 'senior' | 'junior' | 'sub-junior' | 'general'
 */
export function normalizeSection(section?: string | null): 'senior' | 'junior' | 'sub-junior' | 'general' {
  if (!section) return 'general';
  const clean = section.toString().toLowerCase().replace(/[\s_]+/g, '-').trim();
  if (clean === 'sub-junior' || clean === 'subjunior' || clean === 'sub') {
    return 'sub-junior';
  }
  if (clean === 'junior' || clean === 'jr') {
    return 'junior';
  }
  if (clean === 'senior' || clean === 'sr') {
    return 'senior';
  }
  return 'general';
}

/**
 * Returns the section rules, falling back to defaults if not set in festInfo.
 */
export function getSectionLimits(
  festInfo?: Partial<FestivalInfo> | null,
  section?: string | null
): SectionRuleConfig {
  const normSection = normalizeSection(section);
  const defaults = DEFAULT_SECTION_LIMITS[normSection] || DEFAULT_SECTION_LIMITS.general!;

  const configured = festInfo?.sectionLimits?.[normSection];
  if (!configured) {
    return defaults;
  }

  return {
    artsStage: {
      min: configured.artsStage?.min ?? defaults.artsStage.min,
      max: configured.artsStage?.max ?? defaults.artsStage.max
    },
    artsNonStage: {
      min: configured.artsNonStage?.min ?? defaults.artsNonStage.min,
      max: configured.artsNonStage?.max ?? defaults.artsNonStage.max
    },
    sports: {
      min: configured.sports?.min ?? defaults.sports.min,
      max: configured.sports?.max ?? defaults.sports.max
    },
    maxSongs: configured.maxSongs ?? defaults.maxSongs ?? (normSection === 'junior' ? 4 : undefined)
  };
}

/**
 * Classifies a programme into artsStage, artsNonStage, or sports.
 */
export function getProgrammeTypeKey(programme: {
  category?: string;
  subcategory?: string;
  code?: string;
  name?: string;
}): ProgrammeTypeKey {
  const category = (programme.category || '').toLowerCase().trim();
  const subcategory = (programme.subcategory || '').toLowerCase().trim();

  if (category === 'sports') {
    return 'sports';
  }
  if (subcategory === 'stage') {
    return 'artsStage';
  }
  if (subcategory === 'non-stage' || subcategory === 'nonstage') {
    return 'artsNonStage';
  }

  // Fallback by code prefix if subcategory is missing
  const code = (programme.code || '').toUpperCase().trim();
  if (code.includes('NS')) {
    return 'artsNonStage';
  }
  return 'artsStage';
}

/**
 * Returns human-readable label for programme type.
 */
export function getProgrammeTypeLabel(typeKey: ProgrammeTypeKey): string {
  switch (typeKey) {
    case 'artsStage':
      return 'Arts Stage';
    case 'artsNonStage':
      return 'Arts Non-Stage';
    case 'sports':
      return 'Sports';
  }
}

/**
 * Checks if a programme is one of the 7 Junior Song Programmes.
 * Explicitly EXCLUDES Poem Recitation and Malappatt.
 */
export function isJuniorSongProgramme(programme: {
  section?: string;
  category?: string;
  subcategory?: string;
  name?: string;
  code?: string;
}): boolean {
  const normSection = normalizeSection(programme.section);
  if (normSection !== 'junior') return false;

  const category = (programme.category || '').toLowerCase().trim();
  if (category && category !== 'arts') return false;

  const name = (programme.name || '').toLowerCase().trim();
  const code = (programme.code || '').toUpperCase().trim();

  // EXCLUSIONS: Poem Recitation and Malappatt are explicitly excluded
  if (
    name.includes('poem') ||
    name.includes('recitation') ||
    name.includes('kavitha') ||
    name.includes('malapattu') ||
    name.includes('malappatt') ||
    name.includes('mala pattu') ||
    code === 'TS13' ||
    code === 'TS14'
  ) {
    return false;
  }

  // Explicit Junior Song codes
  const juniorSongCodes = ['TS07', 'TS08', 'TS09', 'TS10', 'TS11', 'TS12', 'TS18'];
  if (juniorSongCodes.includes(code)) {
    return true;
  }

  // Keywords that identify songs
  const songKeywords = [
    'song',
    'pattu',
    'paattu',
    'ganam',
    'gaanam',
    'naseeda',
    'nasheeda',
    'madhunnabi',
    'bakthi',
    'madura malayalam'
  ];

  return songKeywords.some(kw => name.includes(kw));
}

/**
 * Calculates current participation counts for a candidate.
 * Supports both object argument and positional arguments.
 */
export function getCandidateParticipationStats(
  paramsOrCandidate:
    | {
        candidate: Candidate;
        registrations: ProgrammeParticipant[];
        allProgrammes: Programme[];
        festInfo?: Partial<FestivalInfo> | null;
        excludeProgrammeId?: string;
      }
    | Candidate,
  maybeRegistrations?: ProgrammeParticipant[],
  maybeAllProgrammes?: Programme[],
  maybeFestInfo?: Partial<FestivalInfo> | null,
  maybeExcludeProgrammeId?: string
) {
  let candidate: Candidate;
  let registrations: ProgrammeParticipant[];
  let allProgrammes: Programme[];
  let festInfo: Partial<FestivalInfo> | null | undefined;
  let excludeProgrammeId: string | undefined;

  if (paramsOrCandidate && 'candidate' in paramsOrCandidate && 'registrations' in paramsOrCandidate) {
    candidate = paramsOrCandidate.candidate;
    registrations = paramsOrCandidate.registrations || [];
    allProgrammes = paramsOrCandidate.allProgrammes || [];
    festInfo = paramsOrCandidate.festInfo;
    excludeProgrammeId = paramsOrCandidate.excludeProgrammeId;
  } else {
    candidate = paramsOrCandidate as Candidate;
    registrations = maybeRegistrations || [];
    allProgrammes = maybeAllProgrammes || [];
    festInfo = maybeFestInfo;
    excludeProgrammeId = maybeExcludeProgrammeId;
  }

  const section = normalizeSection(candidate?.section);
  const limits = getSectionLimits(festInfo, section);

  // Map programmes by id and code
  const progMap = new Map<string, Programme>();
  allProgrammes.forEach(p => {
    if (p._id) progMap.set(p._id.toString(), p);
    if ((p as any).id) progMap.set((p as any).id.toString(), p);
    if (p.code) progMap.set(p.code, p);
  });

  let artsStageCount = 0;
  let artsNonStageCount = 0;
  let sportsCount = 0;
  let songCount = 0;

  const candidateParticipations: ProgrammeParticipant[] = [];

  for (const reg of registrations) {
    if (reg.status === 'withdrawn') continue;
    if (excludeProgrammeId && (reg.programmeId === excludeProgrammeId || (reg as any)._id?.toString() === excludeProgrammeId)) {
      continue;
    }

    if (!reg.participants?.includes(candidate?.chestNumber)) {
      continue;
    }

    candidateParticipations.push(reg);

    const prog = progMap.get(reg.programmeId) || (reg.programmeCode ? progMap.get(reg.programmeCode) : undefined);
    if (!prog) continue;

    // Only individual programmes count towards candidate limits
    const isIndividual = prog.positionType === 'individual' || (prog as any).type === 'individual';
    if (!isIndividual) continue;

    const typeKey = getProgrammeTypeKey(prog);
    if (typeKey === 'artsStage') {
      artsStageCount++;
      if (isJuniorSongProgramme(prog)) {
        songCount++;
      }
    } else if (typeKey === 'artsNonStage') {
      artsNonStageCount++;
    } else if (typeKey === 'sports') {
      sportsCount++;
    }
  }

  const isArtsStageMinMet = artsStageCount >= limits.artsStage.min;
  const isArtsNonStageMinMet = artsNonStageCount >= limits.artsNonStage.min;
  const isSportsMinMet = sportsCount >= limits.sports.min;
  const isAllMinMet = isArtsStageMinMet && isArtsNonStageMinMet && isSportsMinMet;

  const warnings: string[] = [];
  if (!isArtsStageMinMet) {
    warnings.push(`Needs ${limits.artsStage.min - artsStageCount} more Arts Stage`);
  }
  if (!isArtsNonStageMinMet) {
    warnings.push(`Needs ${limits.artsNonStage.min - artsNonStageCount} more Arts Non-Stage`);
  }
  if (!isSportsMinMet) {
    warnings.push(`Needs ${limits.sports.min - sportsCount} more Sports`);
  }

  return {
    section,
    limits,
    artsStageCount,
    stageCount: artsStageCount,
    artsNonStageCount,
    nonStageCount: artsNonStageCount,
    sportsCount,
    songCount,
    artsCount: artsStageCount + artsNonStageCount,
    registeredCount: artsStageCount + artsNonStageCount + sportsCount,
    candidateParticipations,
    candidateRegistrations: candidateParticipations,
    minStage: limits.artsStage.min,
    maxStage: limits.artsStage.max,
    minNonStage: limits.artsNonStage.min,
    maxNonStage: limits.artsNonStage.max,
    minSports: limits.sports.min,
    maxSports: limits.sports.max,
    maxSongs: limits.maxSongs ?? 4,
    isJunior: section === 'junior',
    isArtsStageMinMet,
    isStageMinMet: isArtsStageMinMet,
    isArtsNonStageMinMet,
    isNonStageMinMet: isArtsNonStageMinMet,
    isSportsMinMet,
    isAllMinMet,
    warnings
  };
}

/**
 * Validates whether a candidate can register for a given individual programme.
 * Supports both object argument and positional arguments.
 */
export function checkCandidateProgrammeEligibility(
  paramsOrCandidate:
    | {
        candidate: Candidate;
        programme: Programme;
        registrations: ProgrammeParticipant[];
        allProgrammes: Programme[];
        festInfo?: Partial<FestivalInfo> | null;
        isEditingCurrentRegistration?: boolean;
      }
    | Candidate,
  maybeProgramme?: Programme,
  maybeRegistrations?: ProgrammeParticipant[],
  maybeAllProgrammes?: Programme[],
  maybeFestInfo?: Partial<FestivalInfo> | null,
  maybeIsEditingCurrentRegistration?: boolean
): {
  eligible: boolean;
  reason?: string;
  currentCount: number;
  maxLimit: number;
  isSong: boolean;
  songCount?: number;
  maxSongs?: number;
} {
  let candidate: Candidate;
  let programme: Programme;
  let registrations: ProgrammeParticipant[];
  let allProgrammes: Programme[];
  let festInfo: Partial<FestivalInfo> | null | undefined;
  let isEditingCurrentRegistration = false;

  if (paramsOrCandidate && 'candidate' in paramsOrCandidate && 'programme' in paramsOrCandidate) {
    candidate = paramsOrCandidate.candidate;
    programme = paramsOrCandidate.programme;
    registrations = paramsOrCandidate.registrations || [];
    allProgrammes = paramsOrCandidate.allProgrammes || [];
    festInfo = paramsOrCandidate.festInfo;
    isEditingCurrentRegistration = paramsOrCandidate.isEditingCurrentRegistration || false;
  } else {
    candidate = paramsOrCandidate as Candidate;
    programme = maybeProgramme!;
    registrations = maybeRegistrations || [];
    allProgrammes = maybeAllProgrammes || [];
    festInfo = maybeFestInfo;
    isEditingCurrentRegistration = maybeIsEditingCurrentRegistration || false;
  }

  // 1. Section check
  if (programme.section && programme.section !== 'general') {
    if (normalizeSection(candidate.section) !== normalizeSection(programme.section)) {
      return {
        eligible: false,
        reason: `Section mismatch (${(candidate.section || '').toUpperCase()} ≠ required ${(programme.section || '').toUpperCase()})`,
        currentCount: 0,
        maxLimit: 0,
        isSong: false
      };
    }
  }

  // 2. Individual check
  const isIndividual = programme.positionType === 'individual' || (programme as any).type === 'individual';
  if (!isIndividual) {
    return { eligible: true, reason: undefined, currentCount: 0, maxLimit: 999, isSong: false };
  }

  const progIdStr = programme._id?.toString() || (programme as any).id?.toString();
  const stats = getCandidateParticipationStats({
    candidate,
    registrations,
    allProgrammes,
    festInfo,
    excludeProgrammeId: isEditingCurrentRegistration ? progIdStr : undefined
  });

  const typeKey = getProgrammeTypeKey(programme);
  const typeLabel = getProgrammeTypeLabel(typeKey);
  const maxLimit = stats.limits[typeKey].max;
  const currentCount =
    typeKey === 'artsStage'
      ? stats.artsStageCount
      : typeKey === 'artsNonStage'
      ? stats.artsNonStageCount
      : stats.sportsCount;

  if (currentCount >= maxLimit) {
    return {
      eligible: false,
      reason: `Max ${typeLabel} limit reached (${currentCount}/${maxLimit} programmes)`,
      currentCount,
      maxLimit,
      isSong: false
    };
  }

  // 3. Junior Song limit check (A participant may take part in up to 4 out of the 7 specified Song Programmes)
  const isSong = isJuniorSongProgramme(programme);
  const maxSongs = stats.limits.maxSongs ?? 4;
  if (isSong && stats.songCount >= maxSongs) {
    return {
      eligible: false,
      reason: `Max Song programmes limit reached (${stats.songCount}/${maxSongs} songs for Junior)`,
      currentCount,
      maxLimit,
      isSong: true,
      songCount: stats.songCount,
      maxSongs
    };
  }

  return {
    eligible: true,
    reason: undefined,
    currentCount,
    maxLimit,
    isSong,
    songCount: stats.songCount,
    maxSongs: isSong ? maxSongs : undefined
  };
}
