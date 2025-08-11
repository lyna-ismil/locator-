require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// --- Middleware ---
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/favicon.ico', (req, res) => res.status(204).send());

// --- Microservices Configuration (with paths for spawning) ---
const services = {
    '/admins':        { url: 'http://localhost:3001', path: path.join(__dirname, '../admin/app.js') },
    '/car-owners':    { url: 'http://localhost:3002', path: path.join(__dirname, '../car-owner/app.js') },
    '/stations':      { url: 'http://localhost:3003', path: path.join(__dirname, '../station-service/app.js') },
    '/reclamations':  { url: 'http://localhost:3004', path: path.join(__dirname, '../reclamation-service/app.js') },
    '/reservations':  { url: 'http://localhost:3005', path: path.join(__dirname, '../reservation-service/app.js') },
    '/sessions':      { url: 'http://localhost:3006', path: path.join(__dirname, '../charging-session-service/app.js') },
    '/reviews':       { url: 'http://localhost:3007', path: path.join(__dirname, '../review-service/app.js') },
    '/notifications': { url: 'http://localhost:3008', path: path.join(__dirname, '../notification-service/app.js') }
};

// --- Rate Limiting ---
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// --- Proxy Setup ---
const onProxyReq = (proxyReq, req, res) => {
    // This is the critical fix that re-streams the request body.
    if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};

Object.keys(services).forEach(route => {
    const proxyOptions = {
        target: services[route].url,
        changeOrigin: true,
        pathRewrite: {
            [`^${route}`]: '',
        },
        onProxyReq: onProxyReq, // Apply the body-parser fix
        onError: (err, req, res) => {
            console.error(`❌ Proxy Error on ${route}: ${err.message}`);
            res.status(503).json({ error: `Service ${route} is unavailable` });
        }
    };
    app.use(route, createProxyMiddleware(proxyOptions));
});


// --- Helper Functions ---
const startMicroservices = () => {
    console.log("🚀 Starting Microservices...");
    for (const [route, service] of Object.entries(services)) {
        const serviceDir = path.dirname(service.path);
        const microserviceProcess = spawn('npm', ['start'], {
            cwd: serviceDir,
            stdio: 'inherit', // Show service logs in the gateway's terminal
            shell: true
        });

        microserviceProcess.on('exit', (code) => {
            console.error(`❌ Microservice ${route} exited with code ${code}.`);
        });
    }
};

const checkMicroserviceHealth = async () => {
    console.log("⏳ Checking microservices health...");
    for (const [route, service] of Object.entries(services)) {
        try {
            await axios.get(`${service.url}/health`);
            console.log(`✅ ${route} is responding.`);
        } catch (err) {
            console.warn(`🟡 ${route} is not responding to health check.`);
        }
    }
};

// --- Gateway Health & Debug Endpoints ---
app.get('/gateway/health', (req, res) => {
    res.status(200).json({ message: "API Gateway is Running 🚀" });
});

app.get('/gateway/services', (req, res) => {
    res.status(200).json({ services: Object.keys(services) });
});

// --- Fallback for Not Found Routes ---
app.use((req, res) => {
    console.warn(`❌ Unmatched Route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "Route Not Found" });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    startMicroservices();
    // Wait a few seconds for services to start before checking their health
    setTimeout(checkMicroserviceHealth, 5000);
});

module.exports = app;
