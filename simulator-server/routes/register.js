/**
 * רישום משתמשי קצה – MongoDB (NoSQL).
 * יוצר גם רשומת Device בצי (Fleet Management).
 */
const express = require('express');
const Registration = require('../models/Registration');
const Device = require('../models/Device');
const { randomPointNear } = require('../utils/geo');
const { encodeGeohash } = require('../utils/geohash');

const router = express.Router();

const DEFAULT_CENTER = { lat: 32.0853, lon: 34.7818 };

router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      loraId,
      hasDefibrillator,
      hasLora,
      medicalTraining = 'none',
      participantType = 'defibrillator_owner',
    } = req.body;

    const allowedTraining = ['none', 'cpr', 'first_aid', 'medic', 'other'];
    const training = allowedTraining.includes(medicalTraining) ? medicalTraining : 'none';

    if (!firstName?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'שם פרטי ומספר נייד הם שדות חובה' });
    }

    const defib = Boolean(hasDefibrillator);
    const lora = Boolean(hasLora);

    const allowedParticipants = [
      'defibrillator_owner',
      'lora_hiker',
      'lora_biker',
      'lora_guide',
      'lora_home',
      'lora_other',
    ];
    const pType = allowedParticipants.includes(participantType)
      ? participantType
      : defib
        ? 'defibrillator_owner'
        : 'lora_other';

    if (!defib && !lora) {
      return res.status(400).json({
        error: 'יש להירשם כבעל דפיברילטור, LoRa, או שניהם',
      });
    }

    if (lora && !loraId?.trim()) {
      return res.status(400).json({ error: 'LoRA ID נדרש כשנרשמים עם LoRa' });
    }

    let role = 'defibrillator_only';
    if (defib && lora) role = 'defibrillator_lora';
    else if (lora) role = 'lora_only';

    const reg = await Registration.create({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      phone: phone.trim(),
      loraId: (loraId || '').trim(),
      hasDefibrillator: defib,
      hasLora: lora,
      role,
      medicalTraining: training,
      participantType: pType,
    });

    const point = randomPointNear(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon, 500, 15000);
    const ownerName = `${firstName.trim()} ${(lastName || '').trim()}`.trim();

    const device = await Device.create({
      registrationId: reg._id,
      devEui: lora ? loraId.trim() : undefined,
      ownerName,
      phone: phone.trim(),
      medicalTraining: training,
      hasDefibrillator: defib,
      hasLora: lora,
      lat: point.lat,
      lon: point.lon,
      geohash: encodeGeohash(point.lat, point.lon),
      batteryPercent: 100,
      loraBatteryPercent: lora ? 100 : 0,
      isHealthy: true,
      isSimulated: false,
      participantType: pType,
      lastPingAt: new Date(),
    });

    res.status(201).json({
      success: true,
      id: reg._id,
      deviceId: device._id,
      role,
      message: 'נרשמת בהצלחה והצטרפת לצי המכשירים',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  const list = await Registration.find().sort({ createdAt: -1 }).lean();
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const reg = await Registration.findById(req.params.id).lean();
  if (!reg) return res.status(404).json({ error: 'לא נמצא' });
  res.json(reg);
});

router.put('/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      loraId,
      hasDefibrillator,
      hasLora,
      medicalTraining,
      participantType,
    } = req.body;

    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'לא נמצא' });

    if (firstName != null) reg.firstName = String(firstName).trim();
    if (lastName != null) reg.lastName = String(lastName || '').trim();
    if (phone != null) reg.phone = String(phone).trim();
    if (loraId != null) reg.loraId = String(loraId).trim();
    if (hasDefibrillator != null) reg.hasDefibrillator = Boolean(hasDefibrillator);
    if (hasLora != null) reg.hasLora = Boolean(hasLora);
    if (medicalTraining != null) reg.medicalTraining = medicalTraining;
    if (participantType != null) reg.participantType = participantType;

    let role = 'defibrillator_only';
    if (reg.hasDefibrillator && reg.hasLora) role = 'defibrillator_lora';
    else if (reg.hasLora) role = 'lora_only';
    reg.role = role;

    await reg.save();

    const ownerName = `${reg.firstName} ${reg.lastName || ''}`.trim();
    await Device.findOneAndUpdate(
      { registrationId: reg._id },
      {
        ownerName,
        phone: reg.phone,
        devEui: reg.hasLora ? reg.loraId || undefined : undefined,
        hasDefibrillator: reg.hasDefibrillator,
        hasLora: reg.hasLora,
        medicalTraining: reg.medicalTraining,
        participantType: reg.participantType,
      }
    );

    res.json({ success: true, registration: reg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'לא נמצא' });

    await Device.deleteOne({ registrationId: reg._id });
    await reg.deleteOne();

    res.json({ success: true, message: 'ההרשמה נמחקה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
