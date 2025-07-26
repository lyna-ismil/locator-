const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    // This option automatically adds `createdAt` and `updatedAt` fields
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);