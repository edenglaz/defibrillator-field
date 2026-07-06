/**
 * עדכון שקט (Silent Update) — המכשיר שולח "ציוץ" LoRa עם GPS וסוללה.
 * ברירת מחדל: פעם בשעה (לפי מפרט). LORA_PING_INTERVAL_MS לשינוי.
 */
const Device = require('../models/Device');
const MaintenancePush = require('../models/MaintenancePush');
const { encodeGeohash } = require('./geohash');

const PING_INTERVAL_MS = Number(process.env.LORA_PING_INTERVAL_MS) || 60 * 60 * 1000;
const PUSH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function sendMaintenancePushIfNeeded(device, alertType, batteryPercent, message) {
  const since = new Date(Date.now() - PUSH_COOLDOWN_MS);
  const recent = await MaintenancePush.findOne({
    deviceId: device._id,
    alertType,
    createdAt: { $gte: since },
  });
  if (recent) return null;

  return MaintenancePush.create({
    deviceId: device._id,
    ownerName: device.ownerName,
    phone: device.phone,
    alertType,
    batteryPercent,
    message,
  });
}

async function runLoRaPingCycle() {
  const devices = await Device.find({ hasLora: true });
  let updated = 0;
  let pushes = 0;

  for (const d of devices) {
    const batteryPercent = Math.max(0, d.batteryPercent - Math.floor(Math.random() * 2));
    const loraBatteryPercent = Math.max(0, d.loraBatteryPercent - Math.floor(Math.random() * 2));

    const lat = d.lat + (Math.random() - 0.5) * 0.001;
    const lon = d.lon + (Math.random() - 0.5) * 0.001;

    let isHealthy = d.isHealthy;
    if (d.hasDefibrillator && batteryPercent < 15) {
      isHealthy = false;
    } else if (d.hasDefibrillator && batteryPercent >= 30 && !isHealthy && Math.random() > 0.7) {
      isHealthy = true;
    }

    await Device.findByIdAndUpdate(d._id, {
      lastPingAt: new Date(),
      lat,
      lon,
      geohash: encodeGeohash(lat, lon),
      batteryPercent,
      loraBatteryPercent,
      isHealthy,
    });

    if (d.hasDefibrillator && batteryPercent < 20) {
      const push = await sendMaintenancePushIfNeeded(
        d,
        'defib_battery',
        batteryPercent,
        `Push תחזוקה: סוללת דפיברילטור ${batteryPercent}% — ${d.ownerName} (${d.phone})`
      );
      if (push) pushes++;
    }
    if (loraBatteryPercent < 20) {
      const push = await sendMaintenancePushIfNeeded(
        d,
        'lora_battery',
        loraBatteryPercent,
        `Push תחזוקה: סוללת LoRa ${loraBatteryPercent}% — ${d.ownerName} (${d.phone})`
      );
      if (push) pushes++;
    }
    if (d.hasDefibrillator && !isHealthy) {
      const push = await sendMaintenancePushIfNeeded(
        d,
        'unhealthy',
        batteryPercent,
        `Push תחזוקה: דפיברילטור לא תקין — ${d.ownerName} (${d.phone})`
      );
      if (push) pushes++;
    }

    updated++;
  }

  if (updated > 0) {
    const mins = Math.round(PING_INTERVAL_MS / 60000);
    console.log(
      `[LoRa Ping] עדכון שקט — ${updated} מכשירים, ${pushes} Push תחזוקה (כל ${mins} דק')`
    );
  }

  return { updated, pushes };
}

function startLoRaPingSimulator() {
  setInterval(() => {
    runLoRaPingCycle().catch((err) => console.error('[LoRa Ping] שגיאה:', err.message));
  }, PING_INTERVAL_MS);
  const mins = Math.round(PING_INTERVAL_MS / 60000);
  console.log(`[LoRa Ping] עדכון שקט אוטומטי — כל ${mins} דקות`);
}

module.exports = { startLoRaPingSimulator, runLoRaPingCycle, PING_INTERVAL_MS };
