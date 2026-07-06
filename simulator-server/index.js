/**
 * שרת 2 – Express + MongoDB (NoSQL) – סימולטור צי ומצוקה
 * פורט ברירת מחדל: 3002
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const registerRoutes = require('./routes/register');
const deviceRoutes = require('./routes/devices');
const distressRoutes = require('./routes/distress');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/defibrillator_field';

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'simulator-fleet-mongodb',
    db: 'MongoDB',
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

app.use('/api/register', registerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/simulator', distressRoutes);

async function start() {
  let mongoUri = MONGO_URI;

  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.warn('[Server 2] Local MongoDB unavailable, starting in-memory DB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log('[Server 2] In-memory MongoDB ready (data resets on restart)');
  }

  console.log('[Server 2] Connected to MongoDB');

  const { startLoRaPingSimulator, runLoRaPingCycle } = require('./utils/loraPingSimulator');

  const Device = require('./models/Device');
  const count = await Device.countDocuments();
  if (count === 0) {
    console.log('[Server 2] Seeding 50 simulated devices...');
    require('child_process').execSync('node seed.js', {
      cwd: __dirname,
      env: { ...process.env, MONGO_URI: mongoUri },
      stdio: 'inherit',
    });
  } else {
    console.log(`[Server 2] ${count} devices in fleet`);
  }

  await runLoRaPingCycle();
  startLoRaPingSimulator();

  app.listen(PORT, () => {
    console.log(`[Server 2] Simulator (MongoDB) on http://localhost:${PORT}`);
  });
}

start();
