// models/Reservation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'CarOwner' },
    carId: { type: String, required: true },
    stationId: { type: Schema.Types.ObjectId, required: true, ref: 'Station' },
    connectorId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    // FIX: Add the expiresAt field required by the frontend countdown
    expiresAt: { type: Date, required: true },
    status: {
        type: String,
        required: true,
        enum: ["Confirmed", "Active", "Completed", "Cancelled", "Expired"],
        default: "Confirmed"
    },
    reservationFee: { type: Number, default: 0 },
    customer: { name: String, email: String },
    vehicleInfo: { make: String, model: String, year: Number }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);