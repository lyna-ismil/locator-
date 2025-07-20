const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reclamationSchema = new Schema({
    submittedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        // In a real microservices environment, you might store the user's ID
        // from the User service here.
    },
    relatedStation: {
        type: Schema.Types.ObjectId,
        // This would be the ID of a station from the Station service.
    },
    category: {
        type: String,
        required: true,
        enum: ["Incorrect Station Info", "Broken Charger", "Billing Issue", "General Feedback"]
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open"
    },
    adminNotes: {
        type: String
    }
}, {
    // This option automatically adds `createdAt` and `updatedAt` (for lastUpdatedAt)
    timestamps: true
});

module.exports = mongoose.model('Reclamation', reclamationSchema);
