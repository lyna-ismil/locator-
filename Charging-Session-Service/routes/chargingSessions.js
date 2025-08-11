const express = require('express');
const router = express.Router();
const ChargingSession = require('../models/ChargingSession');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Charging Session service is running.' });
});

/*
 * @route   POST /
 * @desc    Log a new charging session
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        // 1. Destructure and validate the required fields from the body
        const { userId, stationId, startTime } = req.body;
        if (!userId || !stationId) {
            return res.status(400).json({ message: 'Missing required fields: userId and stationId' });
        }
        
        console.log('📦 Received valid POST body:', req.body);

        // 2. Create the new session with only the data you expect
        const newSession = new ChargingSession({
            userId,
            stationId,
            startTime // and any other fields you want to allow
        });
        
        await newSession.save();
        res.status(201).json(newSession);

    } catch (err) {
        console.error('❌ POST Error:', err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all charging sessions (can be filtered by userId, carId, etc.)
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // req.query allows filtering like /sessions?userId=someId
        const sessions = await ChargingSession.find(req.query).sort({ startTime: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /:id
 * @desc    Get a single charging session by its ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const session = await ChargingSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ msg: 'Charging session not found.' });
        }
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   DELETE /:id
 * @desc    Delete a charging session record
 * @access  Private (Admins only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const session = await ChargingSession.findByIdAndDelete(req.params.id);
        if (!session) {
            return res.status(404).json({ msg: 'Charging session not found.' });
        }
        res.json({ msg: 'Charging session deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
