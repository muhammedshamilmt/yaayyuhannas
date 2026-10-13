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

      // Priority 3: Match code and section
      if (section) {
        const matchCodeAndSection = programmes.find(p => 
          p.code?.trim().toLowerCase() === code &&
          p.section?.trim().toLowerCase() === section
        );
        if (matchCodeAndSection) return matchCodeAndSection;
      }

      // Priority 4: Match by code only
      const matchCodeOnly = programmes.find(p => 
        p.code?.trim().toLowerCase() === code
      );
      if (matchCodeOnly) return matchCodeOnly;
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
