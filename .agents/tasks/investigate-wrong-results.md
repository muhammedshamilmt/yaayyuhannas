# Investigation: Wrong Programme Results on Public /results Page

## Summary Answer

**Three distinct bugs cause wrong/missing results on the public page:**

1. **PRIMARY BUG — festId cookie missing for public users:** The `/api/results`, `/api/teams`, `/api/candidates`, and `/api/programmes` APIs all gate their data behind an `activeFestId` cookie. This cookie is **only set when an admin logs in** (`document.cookie = \`activeFestId=${festId}; path=/\``). Public users at `/results` have no such cookie. The APIs' behavior when the cookie is absent differs per collection:
   - `/api/results`: No `festId` filter → returns **all results from all fests** (every result ever entered).
   - `/api/programmes`: Falls back to querying by active fest name (`/wattaqa/i`) — which may or may not match, and also has a secondary fallback that drops the fest filter entirely.
   - `/api/teams` and `/api/candidates`: No `festId` filter → returns **all teams/candidates from all fests**.
   
   This means results, programmes, candidates, and teams from **old or other fests** all mix together on the public page.

2. **SECONDARY BUG — `result.programme` (string) stored in old/legacy records vs `result.programmeId` (ObjectId string) used for matching:** When an admin submits a result, `handleProgrammeSelection` sets `formData.programme = \`${programme.code} - ${programme.name}\`` (a display string like `"A01 - Essay Writing"`). This string is included in the POST payload as the `programme` field. Separately, the submit handler also sets `programmeId: selectedProgramme?._id?.toString()`. So **new records** have a valid `programmeId`. However any **older records** saved before `programmeId` was added to the submit payload have only `result.programme` (the display string), not `result.programmeId`. The public results page (`/results/page.tsx` line 90) matches `p._id?.toString() === result.programmeId || p.id === result.programmeId` — both sides will be `undefined` for old records, causing the `find()` to return `null`, and those results are silently dropped (`filter(Boolean)`). When results are dropped, the *displayed* programme list is drawn purely from the `programmes` collection, and a mismatched result could appear under the wrong programme if the festId cross-contamination from Bug 1 is also in play.

3. **TERTIARY BUG — `result.programme` string match in schedule pages (affects "completed" badge, not direct results display):** `src/app/schedule/page.tsx` line 62 and `src/app/schedule/[id]/page.tsx` line 164 calculate completed programmes using `result.programme.includes(prog.name)`. If `result.programme` is the legacy string `"A01 - Essay Writing"` and `prog.name` is `"Essay Writing"`, this substring check could match the wrong programme or fail to match the right one.

---

## Evidence with File/Symbol Citations

### Bug 1 — festId cookie is admin-only

**Cookie set location:**
```
src/app/admin/page.tsx, line 117
  document.cookie = `activeFestId=${festId}; path=/`;
```
This runs only when an admin clicks "Select" on a fest. A regular public browser visitor never triggers this.

**API reads the cookie server-side:**
```
src/app/api/results/route.ts, lines 18-24
  const cookieStore = await cookies();
  const activeFestId = cookieStore.get('activeFestId')?.value;
  let query: any = {};
  if (activeFestId) {
    query.festId = activeFestId;
  }
```
When `activeFestId` is absent (public user), `query` stays `{}` → MongoDB returns **all results from all fests**, filtered only by `status !== 'draft'`.

Same pattern in:
- `src/app/api/teams/route.ts` lines 13-18 — no cookie → all teams from all fests
- `src/app/api/candidates/route.ts` lines 29-32 — no cookie → all candidates from all fests
- `src/app/api/programmes/route.ts` lines 29-39 — no cookie → falls back to `fests.findOne({ status: 'active', name: /wattaqa/i })`, which may return a different fest than what results belong to

**Why this causes "wrong programme results":** If a result's `programmeId` points to a programme document from fest-A, but the `programmes` API (with no cookie) returns programmes from fest-B (the most recently active fest), the `find(p => p._id?.toString() === result.programmeId)` lookup fails, and the result is either dropped or misattributed.

### Bug 2 — Old results have `result.programme` display string, not `programmeId`

**Where `formData.programme` gets set as a display string:**
```
src/app/admin/results/page.tsx, lines 161-162
  setFormData(prev => ({
    ...prev,
    programme: `${programme.code} - ${programme.name}`,
```
This stores e.g. `"A01 - Essay Writing"` in `formData.programme`.

**Where `programmeId` is correctly added:**
```
src/app/admin/results/page.tsx, lines 319-323
  const submitData = {
    ...formData,
    status,
    // Always store the real programmeId (ObjectId as string)
    programmeId: selectedProgramme?._id?.toString() || '',
```
The comment says "Always store the real programmeId" — this was added as a fix. But records saved **before this fix** only have the `programme` string field.

**Where the public page tries to match:**
```
src/app/results/page.tsx, line 90
  const programme = programmesData.find(p => p._id?.toString() === result.programmeId || p.id === result.programmeId);
  if (!programme) return null;
```
For an old record with `programmeId === undefined`, both conditions are `undefined === undefined` → TypeScript/JS evaluates `undefined === undefined` as `true`, but the intent was to match by ID. In practice this means **the first programme in the array whose `_id` is also undefined** would be returned, which is unlikely — so old records return `null` and are silently filtered out.

**The `Result` type acknowledges the dual-field problem:**
```
src/types/index.ts, lines 56-57
  programmeId: string;
  programme?: string; // Keep for backward compatibility
```

### Bug 3 — String-based `result.programme.includes(prog.name)` in schedule pages

```
src/app/schedule/page.tsx, line 62
  const completedProgrammes = dayProgrammes.filter((prog: Programme) =>
    (resultsData || []).some((result: Result) => result.programme.includes(prog.name))
  ).length;

src/app/schedule/[id]/page.tsx, line 164
  const completedProgrammes = programmes.filter(prog =>
    results.some(result => result.programme.includes(prog.name))
  );
```

`result.programme` is the legacy display string `"A01 - Essay Writing"`. This substring match is fragile:
- A programme named `"Writing"` would match any result where `result.programme` contains the word "Writing".
- If `result.programme` is `undefined` (modern records don't set it; see the `Result` type where `programme?` is optional), calling `.includes()` on it will throw a runtime error, or if it returns `undefined`, `.includes()` crashes.

### No hardcoded/seed data found in APIs

Checked `src/app/api/results/route.ts`, `src/app/api/programmes/route.ts` — no static seed arrays or hardcoded dummy data. The "dummy" results the user sees come entirely from cross-fest data leakage (Bug 1).

---

## Conclusions

| Bug | Root Cause | Visible Symptom |
|-----|-----------|-----------------|
| 1 | `activeFestId` cookie not present for public users → APIs return all-fest data | Results from old/other fests appear under wrong programmes |
| 2 | Legacy `result.programme` string stored instead of `result.programmeId` ObjectId string | Old results silently dropped OR matched to wrong programme |
| 3 | `result.programme.includes(prog.name)` substring match | Wrong "completed" count on schedule page; potential runtime crash if `result.programme` is undefined |

---

## Recommended Fixes

### Fix 1 (Primary — festId scoping for public users)

The cleanest fix is for each public-facing API to detect the active fest **server-side** (not from cookie) when no `activeFestId` cookie is present:

```typescript
// In /api/results, /api/teams, /api/candidates GET handlers:
const cookieStore = await cookies();
let activeFestId = cookieStore.get('activeFestId')?.value;

if (!activeFestId) {
  // Fall back to the currently-active fest, same way /api/programmes does
  const activeFest = await db.collection('fests').findOne({ status: 'active' });
  if (activeFest) activeFestId = activeFest._id.toString();
}
```

`/api/programmes` already has this fallback; the other three APIs need the same pattern added.

### Fix 2 (Secondary — ObjectId vs string comparison)

The public results page already uses `.toString()` correctly:
```
p._id?.toString() === result.programmeId
```
The issue is that **old result documents** have `programmeId: undefined`. A data migration script should back-fill `programmeId` from `result.programme` for all existing records:

```javascript
// pseudo-code migration
for (const result of db.results.find({ programmeId: { $exists: false } })) {
  // result.programme looks like "A01 - Essay Writing"
  const code = result.programme.split(' - ')[0]; // "A01"
  const prog = db.programmes.findOne({ code });
  if (prog) {
    db.results.updateOne({ _id: result._id }, { $set: { programmeId: prog._id.toString() } });
  }
}
```

### Fix 3 (Tertiary — schedule completed-programme check)

Replace the string-based match with an ID-based one in both schedule pages:

```typescript
// Instead of: result.programme.includes(prog.name)
// Use:
results.some(result => result.programmeId === prog._id?.toString())
```

### Fix 4 (Guard — null-safe `result.programme.includes`)

Until Fix 3 is applied, add a null guard:
```typescript
results.some(result => result.programme?.includes(prog.name) ?? false)
```
