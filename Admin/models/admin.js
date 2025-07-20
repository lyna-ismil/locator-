const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Defines the structure for documents in the 'admins' collection
const adminSchema = new Schema({
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
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Creates and exports the model
module.exports = mongoose.model('Admin', adminSchema);