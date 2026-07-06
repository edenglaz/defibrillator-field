/**
 * ניתוב אופניים – OSRM (שבילים, לא קו אווירי).
 * מקביל ל-Breadcrumbs (עמי ותמי) — מסלולי שטח/אופניים בישראל.
 * אם OSRM לא זמין – fallback לקו ישר (מסומן ב-response).
 */
async function getBikeRoute(fromLat, fromLon, toLat, toLon) {
  const url = `https://router.project-osrm.org/route/v1/bicycle/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error');
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route');

    const route = data.routes[0];
    return {
      type: 'bike',
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      geometry: route.geometry,
      fallback: false,
    };
  } catch {
    return {
      type: 'straight',
      distanceMeters: null,
      durationSeconds: null,
      geometry: {
        type: 'LineString',
        coordinates: [
          [fromLon, fromLat],
          [toLon, toLat],
        ],
      },
      fallback: true,
    };
  }
}

module.exports = { getBikeRoute };
