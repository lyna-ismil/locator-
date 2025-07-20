const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'CarOwner' // Conceptual reference
    },
    stationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Station' // Conceptual reference
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Minimum rating
        max: 5  // Maximum rating
    },
    comment: {
        type: String // Optional text comment
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
});

module.exports = mongoose.model('Review', reviewSchema);
