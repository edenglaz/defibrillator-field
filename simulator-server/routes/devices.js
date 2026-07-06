/**
 * מכשירים / צי – MongoDB.
 * GET – כל המכשירים; PATCH – עדכון מיקום/סוללה (סימולציית LoRa ping).
 */
const express = require('express');
const Device = require('../models/Device');
const MaintenancePush = require('../models/MaintenancePush');
const { encodeGeohash } = require('../utils/geohash');
const { runLoRaPingCycle, PING_INTERVAL_MS } = require('../utils/loraPingSimulator');

const router = express.Router();

router.get('/', async (_req, res) => {
  const devices = await Device.find().sort({ lastPingAt: -1 }).lean();
  res.json(devices);
});

router.get('/fleet-summary', async (_req, res) => {
  const devices = await Device.find().lean();
  const withLora = devices.filter((d) => d.hasLora);
  const recentPingMs = PING_INTERVAL_MS * 1.5;
  const now = Date.now();
  const pingIntervalMinutes = Math.round(PING_INTERVAL_MS / 60000);

  res.json({
    total: devices.length,
    withDefibrillator: devices.filter((d) => d.hasDefibrillator).length,
    withLora: withLora.length,
    healthy: devices.filter((d) => d.isHealthy).length,
    unhealthy: devices.filter((d) => !d.isHealthy).length,
    lowDefibBattery: devices.filter((d) => d.hasDefibrillator && d.batteryPercent < 20).length,
    lowLoraBattery: withLora.filter((d) => d.loraBatteryPercent < 20).length,
    activeLoRaPings: withLora.filter(
      (d) => d.lastPingAt && now - new Date(d.lastPingAt).getTime() < recentPingMs
    ).length,
    pingIntervalMinutes,
  });
});

router.post('/trigger-ping', async (_req, res) => {
  const result = await runLoRaPingCycle();
  res.json({ ok: true, ...result, message: 'עדכון שקט LoRa הופעל ידנית' });
});

router.get('/maintenance-pushes', async (_req, res) => {
  const list = await MaintenancePush.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json(list);
});

router.get('/maintenance-alerts', async (_req, res) => {
  const devices = await Device.find().lean();
  const alerts = [];

  for (const d of devices) {
    if (!d.isHealthy && d.hasDefibrillator) {
      alerts.push({
        type: 'unhealthy',
        ownerName: d.ownerName,
        phone: d.phone,
        message: `דפיברילטור לא תקין — ${d.ownerName} (${d.phone})`,
        lastPingAt: d.lastPingAt,
      });
    }
    if (d.hasDefibrillator && d.batteryPercent < 20) {
      alerts.push({
        type: 'defib_battery',
        ownerName: d.ownerName,
        phone: d.phone,
        batteryPercent: d.batteryPercent,
        message: `סוללת דפיברילטור נמוכה (${d.batteryPercent}%) — ${d.ownerName}`,
        lastPingAt: d.lastPingAt,
      });
    }
    if (d.hasLora && d.loraBatteryPercent < 20) {
      alerts.push({
        type: 'lora_battery',
        ownerName: d.ownerName,
        phone: d.phone,
        loraBatteryPercent: d.loraBatteryPercent,
        message: `סוללת LoRa נמוכה (${d.loraBatteryPercent}%) — Push אוטומטי ל-${d.phone}`,
        lastPingAt: d.lastPingAt,
      });
    }
  }

  res.json(alerts);
});

router.get('/:id', async (req, res) => {
  const device = await Device.findById(req.params.id).lean();
  if (!device) return res.status(404).json({ error: 'מכשיר לא נמצא' });
  res.json(device);
});

router.patch('/:id/ping', async (req, res) => {
  const { lat, lon, batteryPercent, loraBatteryPercent, isHealthy } = req.body;
  const update = { lastPingAt: new Date() };
  if (lat != null) update.lat = lat;
  if (lon != null) update.lon = lon;
  if (lat != null && lon != null) update.geohash = encodeGeohash(lat, lon);
  if (batteryPercent != null) update.batteryPercent = batteryPercent;
  if (loraBatteryPercent != null) update.loraBatteryPercent = loraBatteryPercent;
  if (isHealthy != null) update.isHealthy = isHealthy;

  const device = await Device.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!device) return res.status(404).json({ error: 'מכשיר לא נמצא' });

  if (batteryPercent != null && device.hasDefibrillator && device.batteryPercent < 15) {
    device.isHealthy = false;
    await device.save();
  }

  let maintenanceAlert = null;
  if (!device.isHealthy && device.hasDefibrillator) {
    maintenanceAlert = `דפיברילטור לא תקין — ${device.ownerName}`;
  } else if (device.loraBatteryPercent < 20 && device.hasLora) {
    maintenanceAlert = `סוללת LoRa נמוכה (${device.loraBatteryPercent}%) — Push מדומה ל-${device.phone}`;
  } else if (device.batteryPercent < 20 && device.hasDefibrillator) {
    maintenanceAlert = `סוללת דפיברילטור נמוכה (${device.batteryPercent}%) — ${device.ownerName}`;
  }

  res.json({ ...device.toObject(), maintenanceAlert });
});

module.exports = router;
