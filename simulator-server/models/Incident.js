const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    distressGeohash: String,
    source: { type: String, enum: ['app', 'phone', '101', 'simulator'], default: 'simulator' },
    reporterPhone: String,
    status: {
      type: String,
      enum: ['open', 'volunteers_notified', 'volunteer_en_route', 'resolved'],
      default: 'open',
    },
    radiusMeters: { type: Number, default: 3000 },
    alertedDevices: [{ deviceId: mongoose.Schema.Types.ObjectId, distanceMeters: Number }],
    volunteerResponses: [
      {
        deviceId: mongoose.Schema.Types.ObjectId,
        ownerName: String,
        accepted: Boolean,
        distanceMeters: Number,
        routeGeometry: Object,
        etaSeconds: Number,
        respondedAt: { type: Date, default: Date.now },
      },
    ],
    dispatchReports: [
      {
        message: String,
        volunteerName: String,
        distanceMeters: Number,
        etaSeconds: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    hybridAlerts: {
      pushSent: { type: Boolean, default: false },
      loraDownlinkSent: { type: Boolean, default: false },
      smsSimulated: { type: Boolean, default: false },
    },
    resolvedAt: Date,
    resolutionNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
