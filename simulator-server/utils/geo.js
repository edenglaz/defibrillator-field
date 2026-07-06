/**
 * חישובי גיאוגרפיה – מרחק, Geo-fencing, נקודות אקראיות סביב מצוקה.
 */
const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function randomPointNear(lat, lon, minMeters, maxMeters) {
  const angle = Math.random() * 2 * Math.PI;
  const dist = minMeters + Math.random() * (maxMeters - minMeters);
  const dLat = (dist * Math.cos(angle)) / EARTH_RADIUS_M;
  const dLon = (dist * Math.sin(angle)) / (EARTH_RADIUS_M * Math.cos(toRad(lat)));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lon: lon + (dLon * 180) / Math.PI,
  };
}

function filterByRadius(devices, centerLat, centerLon, radiusMeters) {
  return devices
    .map((d) => ({
      ...d,
      distanceMeters: Math.round(haversineMeters(centerLat, centerLon, d.lat, d.lon)),
    }))
    .filter((d) => d.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

module.exports = { haversineMeters, randomPointNear, filterByRadius };
