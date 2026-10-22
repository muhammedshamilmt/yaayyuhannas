import { Db, ObjectId } from 'mongodb';

export const PRIMARY_ACTIVE_FEST_ID = '6a606c0cff94b85c131f0f8b';

interface ResolveFestOptions {
  requestedFestId?: string | null;
  cookieFestId?: string | null;
  allowInactiveAdmin?: boolean;
}

/**
 * Resolves the valid active festival ID.
 * - Public, candidate, and team-admin workflows strictly resolve to the ACTIVE festival.
 * - Stale/inactive cookies from past tests/fests are ignored.
 * - If no active fest is found in the database, falls back to PRIMARY_ACTIVE_FEST_ID.
 */
export async function resolveActiveFestId(
  db: Db,
  options?: ResolveFestOptions
): Promise<string> {
  const { requestedFestId, cookieFestId, allowInactiveAdmin = false } = options || {};

  // 1. Explicit festId parameter (only if admin explicitly requests it)
  if (requestedFestId && allowInactiveAdmin && ObjectId.isValid(requestedFestId)) {
    const fest = await db.collection('fests').findOne({ _id: new ObjectId(requestedFestId) });
    if (fest) {
      return fest._id.toString();
    }
  }

  // 2. Cookie check: only honor the cookie if that festival is currently ACTIVE
  if (cookieFestId && ObjectId.isValid(cookieFestId)) {
    const cookieFest = await db.collection('fests').findOne({
      _id: new ObjectId(cookieFestId),
      status: 'active'
    });
    if (cookieFest) {
      return cookieFest._id.toString();
    }
  }

  // 3. Find the primary active festival
  if (ObjectId.isValid(PRIMARY_ACTIVE_FEST_ID)) {
    const primaryFest = await db.collection('fests').findOne({
      _id: new ObjectId(PRIMARY_ACTIVE_FEST_ID),
      status: 'active'
    });
    if (primaryFest) {
      return primaryFest._id.toString();
    }
  }

  // 4. Fallback to any active festival
  const activeFest = await db.collection('fests').findOne({ status: 'active' });
  if (activeFest) {
    return activeFest._id.toString();
  }

  // 5. Ultimate fallback
  return PRIMARY_ACTIVE_FEST_ID;
}

/**
 * Returns a MongoDB query matcher for festId that safely matches
 * both string representation and ObjectId representation.
 */
export function getFestIdFilter(festId: string): any {
  if (ObjectId.isValid(festId)) {
    return { $in: [festId, new ObjectId(festId)] };
  }
  return festId;
}
