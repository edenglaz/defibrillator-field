/**
 * Geohash – חיפוש מיקום מהיר לפי תאים גיאוגרפיים.
 * בשלב ראשון: סינון לפי prefix של Geohash (שכנים).
 * בשלב שני: Haversine מדויק לסינון סופי.
 */
const ngeohash = require('ngeohash');
const { haversineMeters } = require('./geo');

function encodeGeohash(lat, lon, precision = 7) {
  return ngeohash.encode(lat, lon, precision);
}

/** מחזיר prefix-ים של תאים שכנים סביב נקודה (כולל המרכז) */
function neighborPrefixes(lat, lon, precision = 5) {
  const center = ngeohash.encode(lat, lon, precision);
  const neighbors = ngeohash.neighbors(center);
  return [center, ...Object.values(neighbors)];
}

/**
 * סינון מכשירים לפי Geohash + Haversine.
 * Geohash מצמצם את החיפוש; Haversine מאמת מרחק מדויק.
 */
function filterByGeohashAndRadius(devices, centerLat, centerLon, radiusMeters) {
  const prefixes = neighborPrefixes(centerLat, centerLon, 5);

  const candidates = devices.filter((d) => {
    if (!d.geohash) return true;
    return prefixes.some((p) => d.geohash.startsWith(p.slice(0, 5)));
  });

  return candidates
    .map((d) => ({
      ...d,
      distanceMeters: Math.round(haversineMeters(centerLat, centerLon, d.lat, d.lon)),
    }))
    .filter((d) => d.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

module.exports = { encodeGeohash, neighborPrefixes, filterByGeohashAndRadius };
