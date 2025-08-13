const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// NEW: Schema for individual reservations
const reservationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Refers to a User model
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    }
}, { timestamps: true });


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

// UPDATED: Schema for each individual connector/plug
const connectorSchema = new Schema({
    type: { type: String, required: true }, // e.g., "CCS Combo 1"
    chargerLevel: { type: String, required: true }, // e.g., "DC Fast Charger"
    powerKW: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Available', 'In Use', 'Reserved', 'Faulted', 'Offline'],
        default: 'Available'
    },
    lastStatusUpdate: { type: Date, default: Date.now },
    reservations: [reservationSchema] // NEW: Array to hold reservations for this specific connector
});

// UPDATED: Main schema for the 'stations' collection
const stationSchema = new Schema({
    stationName: { type: String, required: true },
    network: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ownerId: { type: String, required: true }, // <-- Add this!
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