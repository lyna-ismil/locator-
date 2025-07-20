const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Defines the schema for the nested vehicleDetails object
const vehicleDetailsSchema = new Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number },
    primaryConnector: { type: String, required: true },
    maxChargingSpeed: { type: Number }
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
    // This field is now included
    chargingHistory: { 
        type: [Object] 
    },
    paymentMethods: { 
        type: [Object] 
    }
}, {
    // This option automatically adds `createdAt` and `updatedAt` fields
    timestamps: true
});

// A note on fields automatically handled by Mongoose:
// - `_id` is automatically generated for every document.
// - `createdAt` is automatically added because of the `timestamps: true` option.

module.exports = mongoose.model('CarOwner', carOwnerSchema);
