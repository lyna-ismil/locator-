const express = require('express');
const router = express.Router();
const Station = require('../models/Station');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Station service is running.' });
});

/*
 * @route   POST /
 * @desc    Create a new charging station
 * @access  Private (for Admins or Station Owners)
 */
router.post('/', async (req, res) => {
    try {
        // In a real app, you'd get ownerId from an authenticated user
        const newStation = new Station(req.body);
        await newStation.save();
        res.status(201).json(newStation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all stations
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const stations = await Station.find();
        res.json(stations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /nearby
 * @desc    Find nearby charging stations
 * @access  Public
 */
router.get('/nearby', async (req, res) => {
    try {
        const { longitude, latitude, radius } = req.query; // radius in meters

        if (!longitude || !latitude) {
            return res.status(400).json({ msg: 'Longitude and latitude are required.' });
        }

        const stations = await Station.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius) || 5000 // Default 5km radius
                }
            }
        });
        res.json(stations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /:id
 * @desc    Get a single station by its ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) {
            return res.status(404).json({ msg: 'Station not found.' });
        }
        res.json(station);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   PUT /:id
 * @desc    Update a station's details
 * @access  Private (for Admins or Station Owners)
 */
router.put('/:id', async (req, res) => {
  try {
    console.log("Update payload:", req.body);
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!station) {
      return res.status(404).json({ msg: 'Station not found.' });
    }
    res.json({ msg: 'Station updated successfully.', station });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message, stack: err.stack });
  }
});

/*
 * @route   DELETE /:id
 * @desc    Delete a station
 * @access  Private (for Admins or Station Owners)
 */
router.delete('/:id', async (req, res) => {
    try {
        const station = await Station.findByIdAndDelete(req.params.id);

        if (!station) {
            return res.status(404).json({ msg: 'Station not found.' });
        }

        res.json({ msg: 'Station removed successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   POST /signup
 * @desc    Register a new station owner (and their station)
 * @access  Public
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, ...rest } = req.body;
        // Check if email already exists
        const existing = await Station.findOne({ email });
        if (existing) {
            return res.status(400).json({ msg: 'Email already registered.' });
        }
        // Create station owner (and station)
        const newStation = new Station({ email, password, ...rest });
        await newStation.save();
        // Set ownerId to its own _id for filtering
        newStation.ownerId = newStation._id;
        await newStation.save();
        res.status(201).json(newStation);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/*
 * @route   POST /signin
 * @desc    Station Owner login
 * @access  Public
 */
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const owner = await Station.findOne({ email });
        if (!owner) {
            return res.status(401).json({ msg: 'Invalid credentials.' });
        }
        // For production, use bcrypt to compare hashed passwords!
        if (owner.password !== password) {
            return res.status(401).json({ msg: 'Invalid credentials.' });
        }
        res.json({ msg: 'Login successful', owner });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;