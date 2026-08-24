import { EMPTY_FACILITY_PROFILE, type FacilityProfile } from "@/types";

/**
 * Safely parses a stored facilityProfile JSON string.
 *
 * `facilityProfile` is stored as a serialized JSON string in the Plan table
 * (a legacy convention from the SQLite prototyping era). If the string is ever
 * malformed (DB corruption, manual edit, encoding issue), a bare `JSON.parse`
 * would crash the entire request — including the DOCX export pipeline.
 *
 * This helper returns a safe default instead of throwing, and logs a warning
 * so the issue is discoverable.
 */
export function parseFacilityProfile(raw: string | null): FacilityProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...EMPTY_FACILITY_PROFILE, ...parsed };
    }
    return null;
  } catch (error) {
    console.warn("[safeJsonParse] Failed to parse facilityProfile, returning null:", error);
    return null;
  }
}

/**
 * Safely parses a stored facilityProfile JSON string as a Partial<FacilityProfile>.
 * Used by exportDocx where EMPTY_FACILITY_PROFILE spreading is not desired.
 */
export function parseFacilityProfilePartial(raw: string | null): Partial<FacilityProfile> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Partial<FacilityProfile>;
    }
    return {};
  } catch (error) {
    console.warn("[safeJsonParse] Failed to parse facilityProfile (partial), returning {}:", error);
    return {};
  }
}
