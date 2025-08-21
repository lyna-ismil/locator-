const mongoose = require('mongoose')
const { Schema } = mongoose

// Standardized connector constants
const ALLOWED_CONNECTORS = [
  "CCS","CCS1","CCS2","TYPE2","TYPE1","CHADEMO","TESLA","GB_T","SCHUKO","UK_3_PIN"
]
const CONNECTOR_STATUSES = ["Available","InUse","OutOfOrder"]

// Connector subdocument
const connectorSchema = new Schema({
  type: { type: String, enum: ALLOWED_CONNECTORS, required: true, uppercase: true, trim: true },
  chargerLevel: { type: String, required: true, trim: true },
  powerKW: { type: Number, required: true, min: 1 },
  status: { type: String, enum: CONNECTOR_STATUSES, default: "Available" }
}, { _id: false })

// GeoJSON Point
const pointSchema = new Schema({
  type: { type: String, enum: ["Point"], default: "Point", required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: v => Array.isArray(v) && v.length === 2
  }
}, { _id: false })

// Operating hours (map per weekday)
const operatingHoursSchema = new Schema({
  isOpen: Boolean,
  is24Hours: Boolean,
  openTime: String,
  closeTime: String
}, { _id: false })

// Optional reservation snapshots (lightweight)
const reservationSchema = new Schema({
  userId: { type: String, required: true },
  connectorId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ["active","completed","canceled"], default: "active" }
}, { _id: false })

const stationSchema = new Schema({
  // Auth / ownership
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, sparse: true },
  password: { type: String, required: true, select: false },
  ownerId: { type: String, required: true, index: true },

  // Identity
  stationName: { type: String, required: true, trim: true },
  network: { type: String, required: true, trim: true },

  // Location
  location: { type: pointSchema, required: true, index: '2dsphere' },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },

  // Configuration
  connectors: {
    type: [connectorSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },

  operatingHours: { type: Map, of: operatingHoursSchema, default: {} },

  pricing: {
    perHour: Number,
    perkWh: Number,
    sessionFee: Number,
    notes: String
  },

  amenities: {
    wifi: Boolean,
    restrooms: Boolean,
    food: Boolean,
    shopping: Boolean,
    coffee: Boolean,
    parking: Boolean
  },

  photos: [{ type: String }],

  // Lightweight embedded reservations (optional; heavy logs should live elsewhere)
  reservations: [reservationSchema]
}, { timestamps: true })

// (Optional) simple password hash hook placeholder (uncomment if you add bcrypt):
// stationSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next()
//   const bcrypt = require('bcrypt')
//   this.password = await bcrypt.hash(this.password, 10)
//   next()
// })

const Station = mongoose.model('Station', stationSchema)
Station.ALLOWED_CONNECTORS = ALLOWED_CONNECTORS
Station.CONNECTOR_STATUSES = CONNECTOR_STATUSES

module.exports = Station