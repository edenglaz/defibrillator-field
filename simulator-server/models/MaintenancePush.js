const mongoose = require('mongoose');

const maintenancePushSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    ownerName: String,
    phone: String,
    alertType: {
      type: String,
      enum: ['defib_battery', 'lora_battery', 'unhealthy'],
    },
    batteryPercent: Number,
    message: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenancePush', maintenancePushSchema);
