require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Note: You will need to create and export this router for authentication
// const { authRouter } = require('./auth'); 

// ✅ Logging
app.use(morgan('dev'));

// ✅ CORS & Body Parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Auth Router (Placeholder)
// app.use('/auth', authRouter);

// ✅ Microservices Configuration
const services = {
    '/admins':        { url: 'http://localhost:3001' },
    '/car-owners':    { url: 'http://localhost:3002' },
    '/stations':      { url: 'http://localhost:3003' },
    '/reclamations':  { url: 'http://localhost:3004' },
    '/reservations':  { url: 'http://localhost:3005' },
    '/sessions':      { url: 'http://localhost:3006' },
    '/reviews':       { url: 'http://localhost:3007' },
    '/notifications': { url: 'http://localhost:3008' }
};

// ✅ Rate Limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// ✅ Health Check Function
const checkMicroserviceHealth = async () => {
    console.log("⏳ Checking microservices...");
    for (const [route, service] of Object.entries(services)) {
        try {
            const res = await axios.get(`${service.url}/health`);
            console.log(`✅ ${route} is UP: ${res.data.status || res.data.message}`);
        } catch (err) {
            console.error(`❌ ${route} is DOWN`);
        }
    }
};

// ✅ Proxy Setup
Object.keys(services).forEach(route => {
    app.use(route, createProxyMiddleware({
        target: services[route].url,
        changeOrigin: true,
        // This is the correct way to rewrite the path
        pathRewrite: {
            [`^${route}`]: '',
        },
        onError: (err, req, res) => {
            console.error(`❌ Proxy Error on ${route}: ${err.message}`);
            res.status(503).json({ error: `Service ${route} is unavailable` });
        }
    }));
});

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

// ✅ Start the Gateway
app.listen(PORT, async () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    // Check health of services shortly after startup
    setTimeout(checkMicroserviceHealth, 3000);
});

module.exports = app;