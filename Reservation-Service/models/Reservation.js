const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'CarOwner' // A conceptual reference
    },
    carId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Car' // A conceptual reference
    },
    stationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Station' // A conceptual reference
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
    status: {
        type: String,
        required: true,
        enum: ["Confirmed", "Active", "Completed", "Cancelled", "Expired"],
        default: "Confirmed"
    },
    reservationFee: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Reservation', reservationSchema);
