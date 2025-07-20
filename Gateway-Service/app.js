const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const logger = require('morgan');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios'); // Added for health checks
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- (Placeholder) Authentication Middleware ---
// In a real application, this function would verify a JWT
const authenticateToken = (req, res, next) => {
    console.log('Authentication middleware would run here...');
    // For now, we'll just let all requests pass through.
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
        const microserviceProcess = spawn('node', [service.path], {
            stdio: 'pipe', // Use 'pipe' to capture output
            env: { ...process.env, PORT: new URL(service.url).port }
        });

        // Log output from the microservice
        microserviceProcess.stdout.on('data', (data) => {
            console.log(`[${route}] stdout: ${data}`);
        });
        microserviceProcess.stderr.on('data', (data) => {
            console.error(`[${route}] stderr: ${data}`);
        });

        microserviceProcess.on('exit', (code) => {
            console.error(`❌ Microservice for ${route} exited with code ${code}.`);
        });

        console.log(`✅ Service for route ${route} process started.`);
    }
};

// --- Health Check Function ---
const checkHealth = async () => {
    console.log('\n🩺 Performing health checks...');
    for (const [route, service] of Object.entries(services)) {
        try {
            // Assumes each service will have a GET /health endpoint
            await axios.get(`${service.url}/health`);
            console.log(`✅ ${route} is healthy.`);
        } catch (error) {
            console.error(`❌ ${route} is unhealthy or not responding.`);
        }
    }
};

// --- Proxy Setup ---
for (const [route, service] of Object.entries(services)) {
    app.use(route, authenticateToken, createProxyMiddleware({ // Auth middleware added here
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
