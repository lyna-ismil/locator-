require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

const sessionRouter = require('./routes/chargingSessions');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Environment Variables ---
// Use the standard, generic environment variable names
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3006; // Default to 3006 for this service

// Check for the standard MONGO_URI variable
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined! Check your .env file.');
    process.exit(1);
}

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Charging Session Service - MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ Charging Session Service - MongoDB connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// The gateway will route requests from /sessions to this service's root.
app.use('/', sessionRouter);

// --- Health & Debug Routes ---
// Health check for the gateway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Charging Session service is running.' });
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
    console.log(`🚀 Charging Session Service is running on port ${PORT}`);
});

module.exports = app;
