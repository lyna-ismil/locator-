require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

const adminRouter = require('./routes/admin');

const app = express();

// --- DEBUGGING: Log the request as soon as it arrives ---
app.use((req, res, next) => {
    console.log(`✅ Admin service received a request: ${req.method} ${req.originalUrl}`);
    next();
});

// --- Middleware ---
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Environment Variables ---
// Use the standard, generic environment variable names
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3001; // Default to 3001 for the admin service

// Check for the standard MONGO_URI variable
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined! Check your .env file.');
    process.exit(1);
}

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Admin Service - MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ Admin Service - MongoDB connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// The gateway will route requests from /admins to this service's root.
app.use('/', adminRouter);

// --- Health & Debug Routes ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Admin service is running.' });
});

app.get('/debug/database', (req, res) => {
    const dbState = mongoose.connection.readyState;
    // 1 means connected.
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
    console.log(`🚀 Admin Service is running on port ${PORT}`);
});

module.exports = app;
