const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chargingSessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'CarOwner' // Conceptual reference to the user
    },
    carId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Car' // Conceptual reference to the car
    },
    stationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Station' // Conceptual reference to the station
    },
    connectorId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    energyConsumedKWh: {
        type: Number,
        required: true
    },
    finalCost: {
        type: Number,
        required: true
    },
    reservationId: {
        type: Schema.Types.ObjectId,
        ref: 'Reservation' // Optional link to a reservation
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('ChargingSession', chargingSessionSchema);
