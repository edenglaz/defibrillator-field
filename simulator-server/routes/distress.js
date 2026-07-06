/**
 * סימולטור מצוקה – Geohash, Geo-fencing, התראות היברידיות, ניתוב אופניים, דיווח למוקד.
 */
const express = require('express');
const Device = require('../models/Device');
const Incident = require('../models/Incident');
const { randomPointNear } = require('../utils/geo');
const { encodeGeohash, filterByGeohashAndRadius } = require('../utils/geohash');
const { getBikeRoute } = require('../utils/routing');

const router = express.Router();

let config = {
  defaultRadiusMeters: 3000,
  centerLat: 32.0853,
  centerLon: 34.7818,
};

router.get('/config', (_req, res) => {
  res.json(config);
});

router.put('/config', (req, res) => {
  if (req.body.defaultRadiusMeters != null) {
    config.defaultRadiusMeters = Number(req.body.defaultRadiusMeters);
  }
  if (req.body.centerLat != null) config.centerLat = Number(req.body.centerLat);
  if (req.body.centerLon != null) config.centerLon = Number(req.body.centerLon);
  res.json(config);
});

router.post('/distress', async (req, res) => {
  try {
    const {
      lat = config.centerLat,
      lon = config.centerLon,
      radiusMeters = config.defaultRadiusMeters,
      source = 'simulator',
      reporterPhone = '',
      repositionDevices = true,
    } = req.body;

    const distressGeohash = encodeGeohash(lat, lon);

    let devices = await Device.find({ isHealthy: true }).lean();

    if (repositionDevices && devices.length > 0) {
      const updates = devices.map((d) => {
        const point = randomPointNear(lat, lon, 200, radiusMeters * 0.95);
        return Device.findByIdAndUpdate(d._id, {
          lat: point.lat,
          lon: point.lon,
          geohash: encodeGeohash(point.lat, point.lon),
          lastPingAt: new Date(Date.now() - Math.random() * 15 * 60000),
        });
      });
      await Promise.all(updates);
      devices = await Device.find({ isHealthy: true }).lean();
    }

    const nearby = filterByGeohashAndRadius(devices, lat, lon, radiusMeters);

    const prioritized = nearby
      .filter((d) => d.hasDefibrillator)
      .sort((a, b) => {
        const ageA = Date.now() - new Date(a.lastPingAt).getTime();
        const ageB = Date.now() - new Date(b.lastPingAt).getTime();
        if (Math.abs(ageA - ageB) > 60000) return ageA - ageB;
        return a.distanceMeters - b.distanceMeters;
      });

    const incident = await Incident.create({
      lat,
      lon,
      distressGeohash,
      source,
      reporterPhone,
      radiusMeters,
      status: 'volunteers_notified',
      alertedDevices: prioritized.slice(0, 15).map((d) => ({
        deviceId: d._id,
        distanceMeters: d.distanceMeters,
      })),
      hybridAlerts: {
        pushSent: true,
        loraDownlinkSent: prioritized.some((d) => d.hasLora),
        smsSimulated: Boolean(reporterPhone) || source === '101' || source === 'phone',
      },
    });

    const routes = [];
    for (const d of prioritized.slice(0, 5)) {
      const route = await getBikeRoute(d.lat, d.lon, lat, lon);
      routes.push({
        deviceId: d._id,
        ownerName: d.ownerName,
        phone: d.phone,
        lat: d.lat,
        lon: d.lon,
        hasLora: d.hasLora,
        distanceMeters: d.distanceMeters,
        lastPingAt: d.lastPingAt,
        batteryPercent: d.batteryPercent,
        loraBatteryPercent: d.loraBatteryPercent,
        isHealthy: d.isHealthy,
        medicalTraining: d.medicalTraining || 'none',
        alertChannels: {
          push: true,
          loraBeep: d.hasLora,
          sms: source === '101' || source === 'phone',
        },
        route,
      });
    }

    res.json({
      incidentId: incident._id,
      distress: { lat, lon, radiusMeters, source, geohash: distressGeohash },
      hybridAlerts: incident.hybridAlerts,
      devicesInRadius: nearby.length,
      defibrillatorsAvailable: prioritized.length,
      volunteers: routes,
      allNearby: nearby,
      message:
        'Push + LoRa Downlink נשלחו במקביל. Geohash: ' +
        distressGeohash +
        '. Geo-fencing + דירוג זמינות הושלמו.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incidents', async (_req, res) => {
  const list = await Incident.find().sort({ createdAt: -1 }).limit(20).lean();
  res.json(list);
});

router.get('/incidents/:id', async (req, res) => {
  const incident = await Incident.findById(req.params.id).lean();
  if (!incident) return res.status(404).json({ error: 'אירוע לא נמצא' });
  res.json(incident);
});

router.post('/incidents/:id/respond', async (req, res) => {
  const { deviceId, accepted = true } = req.body;
  const device = await Device.findById(deviceId).lean();
  const incident = await Incident.findById(req.params.id);
  if (!incident || !device) {
    return res.status(404).json({ error: 'אירוע או מכשיר לא נמצא' });
  }

  const route = await getBikeRoute(device.lat, device.lon, incident.lat, incident.lon);
  const distanceMeters = route.distanceMeters ?? Math.round(
    Math.sqrt(
      (device.lat - incident.lat) ** 2 + (device.lon - incident.lon) ** 2
    ) * 111000
  );

  incident.volunteerResponses.push({
    deviceId,
    ownerName: device.ownerName,
    accepted,
    distanceMeters,
    routeGeometry: route.geometry,
    etaSeconds: route.durationSeconds,
    respondedAt: new Date(),
  });

  const dispatchReport = {
    message: `מתנדב ${device.ownerName} בדרך — מרחק ${distanceMeters} מ', ETA ~${route.durationSeconds ? Math.round(route.durationSeconds / 60) : '?'} דק'`,
    volunteerName: device.ownerName,
    distanceMeters,
    etaSeconds: route.durationSeconds,
    createdAt: new Date(),
  };
  incident.dispatchReports.push(dispatchReport);
  incident.status = 'volunteer_en_route';
  await incident.save();

  res.json({
    success: true,
    volunteer: device.ownerName,
    distanceMeters,
    etaSeconds: route.durationSeconds,
    route,
    dispatchReport,
    navigationUrl: `https://www.google.com/maps/dir/?api=1&origin=${device.lat},${device.lon}&destination=${incident.lat},${incident.lon}&travelmode=bicycling`,
    wazeUrl: `https://waze.com/ul?ll=${incident.lat},${incident.lon}&navigate=yes`,
    googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${device.lat},${device.lon}&destination=${incident.lat},${incident.lon}&travelmode=bicycling`,
    breadcrumbsNote:
      'מסלול אופניים מחושב via OSRM (מקביל ל-Breadcrumbs של עמי ותמי בשטח)',
  });
});

router.post('/incidents/:id/resolve', async (req, res) => {
  const { note = 'אירוע נסגר על ידי מוקד' } = req.body;
  const incident = await Incident.findById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'אירוע לא נמצא' });

  incident.status = 'resolved';
  incident.resolvedAt = new Date();
  incident.resolutionNote = note;
  incident.dispatchReports.push({
    message: `אירוע נסגר: ${note}`,
    volunteerName: '',
    distanceMeters: 0,
    etaSeconds: 0,
    createdAt: new Date(),
  });
  await incident.save();

  res.json({ success: true, incident });
});

module.exports = router;
