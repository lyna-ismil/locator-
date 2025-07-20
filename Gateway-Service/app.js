console.log("--- Gateway app.js is starting ---"); // <-- THIS IS THE NEW DEBUGGING LINE

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(require('morgan')('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- (Placeholder) Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    console.log('Authentication middleware would run here...');
    next();
};

// --- Microservices Configuration ---
const services = {
    '/api/v1/admins': { 
        url: process.env.ADMIN_API_URL, 
        path: path.join(__dirname, '../Admin/bin/www') 
    },
    '/api/v1/car-owners': { 
        url: process.env.CAR_OWNER_API_URL, 
        path: path.join(__dirname, '../Car-Owner/bin/www') 
    },
    '/api/v1/stations': { 
        url: process.env.STATION_API_URL, 
        path: path.join(__dirname, '../Station-Service/bin/www') 
    },
    '/api/v1/reclamations': { 
        url: process.env.RECLAMATION_API_URL, 
        path: path.join(__dirname, '../Reclamation-Service/bin/www') 
    },
    '/api/v1/reservations': { 
        url: process.env.RESERVATION_API_URL, 
        path: path.join(__dirname, '../Reservation-Service/bin/www') 
    },
    '/api/v1/sessions': { 
        url: process.env.CHARGING_SESSION_API_URL, 
        path: path.join(__dirname, '../Charging-Session-Service/bin/www') 
    },
    '/api/v1/reviews': { 
        url: process.env.REVIEW_API_URL, 
        path: path.join(__dirname, '../Review-Service/bin/www') 
    },
    '/api/v1/notifications': { 
        url: process.env.NOTIFICATION_API_URL, 
        path: path.join(__dirname, '../Notification-Service/bin/www') 
    }
};

// --- Function to Start Microservices ---
const startMicroservices = () => {
    console.log('🚀 Starting all microservices...');
    for (const [route, service] of Object.entries(services)) {
        const port = new URL(service.url).port;
        const microserviceProcess = spawn('node', [service.path], {
            stdio: 'pipe',
            env: { ...process.env, PORT: port }
        });
        microserviceProcess.stdout.on('data', (data) => console.log(`[${route}]: ${data.toString().trim()}`));
        microserviceProcess.stderr.on('data', (data) => console.error(`[${route} ERROR]: ${data.toString().trim()}`));
        microserviceProcess.on('exit', (code) => console.error(`❌ Microservice for ${route} exited with code ${code}.`));
    }
};

// --- Health Check Function ---
const checkHealth = async () => {
    console.log('\n🩺 Performing health checks...');
    for (const [route, service] of Object.entries(services)) {
        try {
            await axios.get(`${service.url}/health`);
            console.log(`✅ ${route} is healthy.`);
        } catch (error) {
            console.error(`❌ ${route} is unhealthy or not responding.`);
        }
    }
};

// --- Proxy Setup ---
for (const [route, service] of Object.entries(services)) {
    app.use(route, authenticateToken, createProxyMiddleware({
        target: service.url,
        changeOrigin: true,
        onError: (err, req, res) => {
            console.error(`Proxy Error: ${err.message}`);
            res.status(503).json({ message: 'Service unavailable.' });
        }
    }));
}

// Export the app and helper functions for bin/www to use
module.exports = { app, startMicroservices, checkHealth };
