// Load environment variables from the .env file in the root of the service
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Make sure this path points to your car owner routes file
const carOwnerRouter = require('./routes/CarOwner'); 

const app = express();

// --- Middleware ---
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Environment Variables ---
// Use the standard, generic environment variable names
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3002; // Default to 3002 for the car-owner service

// Check for the standard MONGO_URI variable
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined! Check your .env file.');
    process.exit(1);
}

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Car Owner Service - MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ Car Owner Service - MongoDB connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// The gateway will route requests from /car-owners to this service's root.
app.use('/', carOwnerRouter);

// --- Health & Debug Routes ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Car Owner service is running.' });
});

// Database connection status check
app.get('/debug/database', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const status = dbState === 1 ? "Connected" : "Not Connected";
    res.json({ status });
});

// --- Generic Error Handler ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Car Owner Service is running on port ${PORT}`);
});

module.exports = app;
