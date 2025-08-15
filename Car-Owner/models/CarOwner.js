const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Defines the schema for the nested vehicleDetails object
const vehicleDetailsSchema = new Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number },
    primaryConnector: { type: String, required: true },
    maxChargingSpeed: { type: Number },
    // --- NEW FIELD ---
    // Stores any adapters the user has, allowing for more station options.
    adapters: { type: [String] } // e.g., ["CCS", "J-1772"]
}, { _id: false });

// Defines the schema for the user's personal preferences
const preferencesSchema = new Schema({
    // --- NEW FIELDS ---
    // Stores the user's favorite charging networks.
    preferredNetworks: [String], // e.g., ["Electrify America", "ChargePoint"]
    // Stores amenities the user wants to filter for by default.
    requiredAmenities: [String]  // e.g., ["restrooms", "food"]
}, { _id: false });


// Defines the main schema for the Car Owner
const carOwnerSchema = new Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    vehicleDetails: { 
        type: vehicleDetailsSchema, 
        required: true 
    },
    favoriteStations: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Station' 
    }],
    chargingHistory: { 
        type: [Object] 
    },
    paymentMethods: { 
        type: [Object] 
    },
    // --- NEW FIELD ---
    // Embeds the preferences schema into the main user document.
    preferences: { 
        type: preferencesSchema 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CarOwner', carOwnerSchema);
