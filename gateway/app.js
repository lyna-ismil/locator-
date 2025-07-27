require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Note: You must create an 'auth.js' file that exports 'authRouter' and 'verifyToken'.
// const { authRouter, verifyToken } = require('./auth');

// ✅ Logging Middleware
app.use(morgan('dev'));

// ✅ CORS & Body Parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Auth Router (Placeholder)
// app.use('/auth', authRouter);

// ✅ Microservices Configuration (with paths for spawning)
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

// ✅ Rate Limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// ✅ Proxy Setup
const onProxyReq = (proxyReq, req, res) => {
    if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};

Object.keys(services).forEach(route => {
    // This proxy configuration will be used for all routes
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

    // Here you can add middleware like 'verifyToken' before the proxy
    // For now, we will just use the proxy directly.
    app.use(route, createProxyMiddleware(proxyOptions));
});


// ✅ Start Microservices Function
const startMicroservices = () => {
    console.log("🚀 Starting Microservices...");
    for (const [route, service] of Object.entries(services)) {
        console.log(`🔄 Launching ${route} microservice...`);
        // Use 'npm start' which is more standard than calling the file directly
        const serviceDir = path.dirname(service.path);
        const microserviceProcess = spawn('npm', ['start'], {
            cwd: serviceDir, // Set the working directory to the service's folder
            stdio: 'inherit', // Show the service's output in the gateway's console
            shell: true
        });

        microserviceProcess.on('exit', (code) => {
            console.error(`❌ Microservice ${route} exited with code ${code}.`);
        });
    }
};

// ✅ Gateway Health & Debug Endpoints
app.get('/gateway/health', (req, res) => {
    res.status(200).json({ message: "API Gateway is Running 🚀" });
});

app.get('/gateway/services', (req, res) => {
    res.status(200).json({ services: Object.keys(services) });
});

// ✅ Fallback for Not Found Routes
app.use((req, res) => {
    console.warn(`❌ Unmatched Route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "Route Not Found" });
});

// ✅ Start API Gateway
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    startMicroservices();
});

module.exports = app;
