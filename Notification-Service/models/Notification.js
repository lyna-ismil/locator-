const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'CarOwner' // Conceptual reference
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["Reservation_Reminder", "Reclamation_Update", "Charging_Complete", "Promotional"]
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
});

module.exports = mongoose.model('Notification', notificationSchema);