const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    phone: { type: String, required: true },
    loraId: { type: String, default: '' },
    hasDefibrillator: { type: Boolean, default: false },
    hasLora: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['defibrillator_only', 'defibrillator_lora', 'lora_only'],
      required: true,
    },
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
    medicalTraining: {
      type: String,
      enum: ['none', 'cpr', 'first_aid', 'medic', 'other'],
      default: 'none',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
