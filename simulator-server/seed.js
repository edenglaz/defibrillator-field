/**
 * Seed – ~50 מכשירים מדומים סביב ישראל (מרכז כברירת מחדל).
 * npm run seed – מריץ פעם אחת; מוחק מכשירים מדומים קודמים.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Device = require('./models/Device');
const { randomPointNear } = require('./utils/geo');
const { encodeGeohash } = require('./utils/geohash');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/defibrillator_field';

const CENTER = { lat: 32.0853, lon: 34.7818 };
const FIRST_NAMES = ['דני', 'שרה', 'יוסי', 'רון', 'נועה', 'אבי', 'ליאור', 'משה', 'ענת', 'אור', 'גל', 'טל', 'הילה', 'יונתן', 'מאיה'];
const LAST_NAMES = ['כהן', 'לוי', 'מזרחי', 'אביטל', 'גולן', 'שלום', 'פרץ', 'רוזן', 'שפיר', 'בן דוד'];

const TRAINING_LEVELS = ['none', 'cpr', 'first_aid', 'medic', 'other'];

const LORA_ONLY_TYPES = ['lora_hiker', 'lora_biker', 'lora_guide', 'lora_home', 'lora_other'];

function pickParticipantType(i, hasDefib) {
  if (hasDefib) return 'defibrillator_owner';
  return LORA_ONLY_TYPES[i % LORA_ONLY_TYPES.length];
}

function randomPhone() {
  return `05${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function randomDevEui(i) {
  return `DEV-${String(i).padStart(4, '0')}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  await Device.deleteMany({ isSimulated: true });

  const devices = [];
  for (let i = 0; i < 50; i++) {
    const hasLora = Math.random() > 0.35;
    const hasDefib = Math.random() > 0.15 || !hasLora;
    const participantType = pickParticipantType(i, hasDefib);
    const point = randomPointNear(CENTER.lat, CENTER.lon, 500, 8000);
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];

    devices.push({
      devEui: hasLora ? randomDevEui(i) : undefined,
      ownerName: `${first} ${last}`,
      phone: randomPhone(),
      medicalTraining: TRAINING_LEVELS[Math.floor(Math.random() * TRAINING_LEVELS.length)],
      hasDefibrillator: hasDefib,
      hasLora,
      lat: point.lat,
      lon: point.lon,
      geohash: encodeGeohash(point.lat, point.lon),
      batteryPercent: Math.floor(60 + Math.random() * 40),
      loraBatteryPercent:
        hasLora && i < 3 ? Math.floor(5 + Math.random() * 14) : hasLora ? Math.floor(50 + Math.random() * 50) : 0,
      isHealthy: Math.random() > 0.05,
      lastPingAt: new Date(Date.now() - Math.random() * 3600000),
      isSimulated: true,
      participantType,
    });
  }

  await Device.insertMany(devices);
  console.log(`Seeded ${devices.length} simulated devices`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
