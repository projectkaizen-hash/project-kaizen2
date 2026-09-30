/**
 * Coordinate parsing + Google Maps embed URL building for the contact page.
 *
 * Sanity stores lat/lng as free-form strings (they may be DMS like
 * 23\u00b047'42.3"N or garbage like "4567iy"), so we parse defensively.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

const DMS_RE =
  /^\s*(\d{1,3})\u00b0\s*(?:(\d{1,2})['\u2032\u2019]?)?\s*(?:(\d{1,2}(?:\.\d+)?)["\u2033\u201d]?)?\s*([NSEWnsew])?\s*$/;

/**
 * Parses one latitude/longitude value in either decimal ("23.795083") or
 * DMS ("23\u00b047'42.3\"N") form. Decimal is tried first so plain numbers
 * can't be misread as degrees/minutes/seconds. Returns null for anything
 * unparseable (test garbage like "4567iy") or out of range.
 */
export function parseCoord(raw: string | null | undefined, isLat: boolean): number | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  let value: number | null = null;

  // Decimal form. Normalize commas: "1,234.5" (with a dot) means thousands
  // separator -> strip; "23,795083" (no dot) means decimal comma -> dot.
  const normalized = s.includes(".") ? s.replace(/[,\u00a0]/g, "") : s.replace(",", ".");
  const dec = Number(normalized);
  if (Number.isFinite(dec)) {
    value = dec;
  } else {
    // DMS form — requires an explicit degree sign, so "4567iy" can't match
    const dms = s.match(DMS_RE);
    if (dms) {
      const deg = parseFloat(dms[1]);
      const min = dms[2] ? parseFloat(dms[2]) : 0;
      const sec = dms[3] ? parseFloat(dms[3]) : 0;
      const hemi = dms[4]?.toUpperCase();
      value = deg + min / 60 + sec / 3600;
      if (hemi === "S" || hemi === "W") value = -value;
    }
  }

  if (value === null || !Number.isFinite(value)) return null;
  const limit = isLat ? 90 : 180;
  if (Math.abs(value) > limit) return null;
  return value;
}

/**
 * Parses a lat/lng pair; returns a point only if BOTH are valid.
 */
export function parseCoords(
  lat: string | null | undefined,
  lng: string | null | undefined
): GeoPoint | null {
  const pLat = parseCoord(lat, true);
  const pLng = parseCoord(lng, false);
  if (pLat === null || pLng === null) return null;
  return { lat: pLat, lng: pLng };
}

/**
 * Google Maps embed URL (no API key needed):
 *  - with a point -> pin at those coordinates
 *  - with only a query -> text search (e.g. the studio address)
 */
export function buildMapEmbedUrl(point: GeoPoint | null, query: string | null): string | null {
  if (point) {
    return `https://www.google.com/maps?q=${point.lat},${point.lng}&z=16&output=embed`;
  }
  const q = query?.trim();
  if (q) {
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
  }
  return null;
}
