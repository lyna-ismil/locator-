const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for the physical location (supports geospatial queries)
const pointSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    }
}, { _id: false });

// Schema for each individual connector/plug
const connectorSchema = new Schema({
    type: { type: String, required: true }, // e.g., "CCS Combo 1"
    chargerLevel: { type: String, required: true }, // e.g., "DC Fast Charger"
    powerKW: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Available', 'In Use', 'Faulted', 'Offline'],
        default: 'Available'
    },
    lastStatusUpdate: { type: Date, default: Date.now }
});

// Main schema for the 'stations' collection
const stationSchema = new Schema({
    stationName: { type: String, required: true },
    network: { type: String, required: true },
    location: {
        type: pointSchema,
        required: true,
        index: '2dsphere' // CRITICAL: This enables efficient geospatial queries
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    operatingHours: { type: String, default: '24/7' },
    connectors: [connectorSchema], // An array of connectors
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
        shopping: Boolean
    }
}, {
    timestamps: true // Adds createdAt and lastUpdated (as updatedAt)
});

module.exports = mongoose.model('Station', stationSchema);
