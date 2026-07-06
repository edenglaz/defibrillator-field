const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
    devEui: { type: String, unique: true, sparse: true },
    ownerName: String,
    phone: String,
    medicalTraining: {
      type: String,
      enum: ['none', 'cpr', 'first_aid', 'medic', 'other'],
      default: 'none',
    },
    hasDefibrillator: { type: Boolean, default: true },
    hasLora: { type: Boolean, default: false },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    geohash: { type: String, index: true },
    batteryPercent: { type: Number, default: 100 },
    loraBatteryPercent: { type: Number, default: 100 },
    isHealthy: { type: Boolean, default: true },
    lastPingAt: { type: Date, default: Date.now },
    participantType: {
      type: String,
      enum: [
        'defibrillator_owner',
        'lora_hiker',
        'lora_biker',
        'lora_guide',
        'lora_home',
        'lora_other',
      ],
      default: 'defibrillator_owner',
    },
    isSimulated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
