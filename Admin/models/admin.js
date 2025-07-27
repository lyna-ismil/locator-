const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This schema defines the data structure for an Admin document.
// It directly corresponds to the fields used in your routes/admin.js file.
const adminSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no two admins can have the same email
        lowercase: true // Stores the email in lowercase to prevent case-sensitivity issues
    },
    password: {
        type: String,
        required: true
    }
}, {
    // This option automatically adds `createdAt` and `updatedAt` fields to the document,
    // which is referenced in your POST route's response.
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
