import { Programme, Result } from '@/types';

/**
 * Robustly matches a result to its corresponding programme from the programmes list.
 * Prevents bugs where undefined === undefined matches the first programme in the list.
 */
export function findProgramme(
  result: Partial<Result> | { programmeId?: string | null; programme?: string | null; section?: string | null } | null | undefined,
  programmes: Programme[]
): Programme | undefined {
  if (!result || !Array.isArray(programmes) || programmes.length === 0) return undefined;

  const progId = result.programmeId ? String(result.programmeId).trim() : null;
  const progStr = result.programme ? String(result.programme).trim() : null;
  const section = result.section ? String(result.section).trim().toLowerCase() : null;

  // 1. Match by valid programmeId (strictly non-empty string)
  if (progId) {
    const matchById = programmes.find(p => {
      const pId = p._id ? String(p._id) : p.id ? String(p.id) : null;
      return pId === progId || (p.code && p.code.toLowerCase() === progId.toLowerCase());
    });
    if (matchById) return matchById;
  }

  // 2. Match by result.programme string (e.g. "AS05 - Shootout ")
  if (progStr) {
    const cleanProgStr = progStr.toLowerCase();

    // 2a. Match exact "CODE - Name" (trimmed)
    const matchExact = programmes.find(p => {
      const fullName = `${p.code} - ${p.name}`.trim().toLowerCase();
      return fullName === cleanProgStr;
    });
    if (matchExact) return matchExact;

    // 2b. If formatted as "CODE - Name", split and match code + name
    if (progStr.includes(' - ')) {
      const parts = progStr.split(' - ');
      const code = parts[0].trim().toLowerCase();
      const name = parts.slice(1).join(' - ').trim().toLowerCase();

      // Priority 1: Match code, name, and section
      if (section) {
        const matchFullWithSection = programmes.find(p => 
          p.code?.trim().toLowerCase() === code &&
          p.name?.trim().toLowerCase() === name &&
          p.section?.trim().toLowerCase() === section
        );
        if (matchFullWithSection) return matchFullWithSection;
      }

      // Priority 2: Match code and name
      const matchCodeAndName = programmes.find(p => 
        p.code?.trim().toLowerCase() === code &&
        p.name?.trim().toLowerCase() === name
      );
      if (matchCodeAndName) return matchCodeAndName;
    }

    // 2c. Match by programme name
    if (section) {
      const matchNameAndSection = programmes.find(p => 
        p.name?.trim().toLowerCase() === cleanProgStr &&
        p.section?.trim().toLowerCase() === section
      );
      if (matchNameAndSection) return matchNameAndSection;
    }

    const matchName = programmes.find(p => 
      p.name?.trim().toLowerCase() === cleanProgStr
    );
    if (matchName) return matchName;
  }

  return undefined;
}

/**
 * Extracts a human-readable programme name from a result and its matched programme.
 * Even if programme is undefined, extracts the name part from result.programme.
 */
export function getProgrammeName(
  result: Partial<Result> | { programmeId?: string | null; programme?: string | null } | null | undefined,
  programme?: Programme | null
): string {
  if (programme?.name && programme.name.trim()) {
    return programme.name.trim();
  }

  const progStr = result?.programme ? String(result.programme).trim() : '';
  if (progStr) {
    if (progStr.includes(' - ')) {
      const parts = progStr.split(' - ');
      const namePart = parts.slice(1).join(' - ').trim();
      if (namePart) return namePart;
    }
    return progStr;
  }

  return 'Unknown Programme';
}

/**
 * Extracts the programme code from a result and its matched programme.
 */
export function getProgrammeCode(
  result: Partial<Result> | { programmeId?: string | null; programme?: string | null } | null | undefined,
  programme?: Programme | null
): string {
  if (programme?.code && programme.code.trim()) {
    return programme.code.trim();
  }

  const progStr = result?.programme ? String(result.programme).trim() : '';
  if (progStr && progStr.includes(' - ')) {
    return progStr.split(' - ')[0].trim();
  }

  return '';
}

/**
 * Safely extracts the publication timestamp of a result in milliseconds.
 * Priority order:
 * 1. result.publishedAt
 * 2. result.publishedDate
 * 3. result.updatedAt (when result was updated/published)
 * 4. result.createdAt (when result was created)
 * 5. MongoDB ObjectId timestamp from _id
 */
export function getResultPublishedTime(result: (Partial<Result> & { publishedAt?: Date | string; publishedDate?: Date | string }) | null | undefined): number {
  if (!result) return 0;
  if (result.publishedAt) {
    const t = new Date(result.publishedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (result.publishedDate) {
    const t = new Date(result.publishedDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (result.updatedAt) {
    const t = new Date(result.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (result.createdAt) {
    const t = new Date(result.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (result._id) {
    const idStr = String(result._id);
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      const t = parseInt(idStr.substring(0, 8), 16) * 1000;
      if (!isNaN(t) && t > 0) return t;
    }
  }
  return 0;
}

// Backward compatibility alias
export const getResultAddedTime = getResultPublishedTime;

/**
 * Standard default marks / points for participation grades:
 * A -> 3
 * B -> 2
 * C -> 1
 * D / E / F -> 0
 */
export const DEFAULT_GRADE_POINTS: Record<string, number> = {
  'A': 3,
  'B': 2,
  'C': 1,
  'D': 0,
  'E': 0,
  'F': 0,
};

/**
 * Returns default marks for a given grade string (e.g. 'A' -> 3, 'B' -> 2, 'C' -> 1).
 */
export function getDefaultGradePoints(grade?: string | null): number {
  if (!grade) return 0;
  const normalized = grade.trim().toUpperCase();
  if (normalized === 'A' || normalized === 'A+') return 3;
  if (normalized === 'B' || normalized === 'B+') return 2;
  if (normalized === 'C' || normalized === 'C+') return 1;
  return DEFAULT_GRADE_POINTS[normalized] ?? 0;
}

/**
 * Checks if a result has already been added for a given programme (and optional section).
 * Returns the matching Result object if found, or undefined otherwise.
 */
export function findExistingResultForProgramme(
  programme: Programme | { _id?: string; id?: string; code?: string; name?: string; section?: string; festId?: string } | null | undefined,
  results: Result[] = [],
  targetSection?: string | null
): Result | undefined {
  if (!programme || !Array.isArray(results) || results.length === 0) return undefined;

  const progId = programme._id ? String(programme._id).trim() : (programme as any).id ? String((programme as any).id).trim() : null;
  const progCode = programme.code ? programme.code.trim().toLowerCase() : null;
  const progName = programme.name ? programme.name.trim().toLowerCase() : null;
  const expectedSection = (targetSection || programme.section || '').trim().toLowerCase();
  const progFestId = (programme as any).festId ? String((programme as any).festId).trim() : null;

  return results.find(r => {
    // 0. Fest ID check: must match if both documents have festId
    const rFestId = (r as any).festId ? String((r as any).festId).trim() : null;
    if (progFestId && rFestId && progFestId !== rFestId) {
      return false;
    }

    const rProgId = r.programmeId ? String(r.programmeId).trim() : null;
    const rProgStr = r.programme ? String(r.programme).trim().toLowerCase() : '';
    const rSection = (r.section || '').trim().toLowerCase();

    // Section comparison (if specified)
    const sectionMatches = !expectedSection || !rSection || expectedSection === rSection;
    if (!sectionMatches) return false;

    // 1. Exact programmeId match (ObjectId string) - HIGHEST CONFIDENCE
    if (progId && rProgId && progId === rProgId) {
      return true;
    }

    // 2. Exact code AND name match (when r.programme is "CODE - NAME")
    if (rProgStr.includes(' - ')) {
      const parts = rProgStr.split(' - ');
      const rCode = parts[0].trim().toLowerCase();
      const rName = parts.slice(1).join(' - ').trim().toLowerCase();

      // Must match BOTH code AND name to prevent collisions between programmes sharing codes
      if (progCode && rCode && progCode === rCode && progName && rName && progName === rName) {
        return true;
      }
    }

    // 3. Exact full string match "CODE - Name"
    if (progCode && progName && rProgStr === `${progCode} - ${progName}`) {
      return true;
    }

    // 4. Exact name match ONLY if result has no code prefix or name strictly matches
    if (progName && rProgStr === progName) {
      return true;
    }

    return false;
  });
}
