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
 * @route   POST /register
 * @desc    Register a new Car Owner
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, vehicleDetails } = req.body;

        console.log("Received body:", req.body);

        // 1. Basic Validation
        if (!fullName || !email || !password || !vehicleDetails) {
            return res.status(400).json({ msg: 'Please provide all required fields, including vehicle details.' });
        }
        if (!vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.primaryConnector) {
            return res.status(400).json({ msg: 'Vehicle make, model, and primaryConnector are required.' });
        }

        // 2. Check if a user with this email already exists
        let user = await CarOwner.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        // 3. Create a new CarOwner instance
        user = new CarOwner({
            fullName,
            email,
            password,
            vehicleDetails
        });

        // 4. Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 5. Save the new user to the database
        await user.save();
        
        // 6. Respond with the created user's data (excluding the password)
        res.status(201).json({
            msg: 'Car Owner registered successfully.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                vehicle: user.vehicleDetails,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /profile/:id
 * @desc    Get a Car Owner's profile by ID
 * @access  Private (requires authentication)
 */
router.get('/profile/:id', async (req, res) => {
    try {
        // Find the user by their ID and exclude the password from the result
        const user = await CarOwner.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        res.json(user);

    } catch (err) {
        console.error(err.message);
        // If the ID format is invalid, it might throw an error
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found.' });
        }
        res.status(500).send('Server Error');
    }
});

/*
 * @route   PUT /profile/:id
 * @desc    Update a Car Owner's profile
 * @access  Private (requires authentication)
 */
router.put('/profile/:id', async (req, res) => {
    try {
        const { fullName, vehicleDetails } = req.body;

        // Build the update object
        const updatedFields = {};
        if (fullName) updatedFields.fullName = fullName;
        if (vehicleDetails) updatedFields.vehicleDetails = vehicleDetails;

        // Find the user by ID and update their details
        // The { new: true } option returns the modified document
        const user = await CarOwner.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        res.json({ msg: 'Profile updated successfully.', user });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   POST /signin
 * @desc    Sign in as a Car Owner (EV Driver)
 * @access  Public
 */
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password.' });
        }

        // Find user by email
        const user = await CarOwner.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid email or password.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email or password.' });
        }

        // Success: return user info (excluding password)
        res.json({
            msg: 'Signed in successfully.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                vehicle: user.vehicleDetails,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
