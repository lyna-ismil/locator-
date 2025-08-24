const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Import the CarOwner model
const CarOwner = require('../models/CarOwner');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Car Owner service is running.' });
});

/*
 * @route   GET /
 * @desc    Get all Car Owners
 * @access  Private (typically for Admins)
 */
router.get('/', async (req, res) => {
    try {
        // Find all users and exclude their passwords from the result
        const users = await CarOwner.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   POST /register
 * @desc    Register a new Car Owner
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, vehicleDetails } = req.body;
    if (!fullName || !email || !password || !vehicleDetails ||
        !vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.primaryConnector) {
      return res.status(400).json({ msg: 'Missing required fields.' });
    }
    let user = await CarOwner.findOne({ email: email.toLowerCase().trim() });
    if (user) return res.status(400).json({ msg: 'A user with this email already exists.' });

    // Simplified: model pre-save hook will hash the password
    user = new CarOwner({
      fullName,
      email: email.toLowerCase().trim(),
      password,
      vehicleDetails
    });

    await user.save();

    res.status(201).json({
      msg: 'Car Owner registered successfully.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        vehicleDetails: user.vehicleDetails,
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/*
 * @route   GET /profile/:id
 * @desc    Get profile
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await CarOwner.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        vehicleDetails: user.vehicleDetails,
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found.' });
    res.status(500).send('Server Error');
  }
});

/*
 * @route   PUT /profile/:id
 * @desc    Update profile
 */
router.put('/profile/:id', async (req, res) => {
  try {
    const { fullName, vehicleDetails, preferences } = req.body;
    const updatedFields = {};
    if (fullName) updatedFields.fullName = fullName;
    if (vehicleDetails) updatedFields.vehicleDetails = vehicleDetails;
    if (preferences) updatedFields.preferences = preferences;

    const user = await CarOwner.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    res.json({
      msg: 'Profile updated successfully.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        vehicleDetails: user.vehicleDetails,
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/*
 * @route   POST /signin
 * @desc    Sign in
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ msg: 'Please provide email and password.' })

    // INCLUDE the password field for this query
    const user = await CarOwner.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) return res.status(400).json({ msg: 'Invalid email or password.' })

    // use bcrypt (bcryptjs) imported at the top of the file
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password.' })

    const safeUser = user.toObject()
    delete safeUser.password
    res.json({ msg: 'Signin successful', user: safeUser })
  } catch (err) {
    console.error('Signin error', err)
    res.status(500).json({ msg: 'Server Error' })
  }
});

/*
 * @route   GET /:id
 * @desc    (Alias) Get profile by ID
 * @note    Placed AFTER specific routes to avoid collisions.
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await CarOwner.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        vehicleDetails: user.vehicleDetails,
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found.' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;