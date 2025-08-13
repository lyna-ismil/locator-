const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Import the Admin model we created earlier
const Admin = require('../models/admin');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    // This simple response tells the gateway that the service is running.
    res.status(200).json({ status: 'UP', message: 'Admin service is running.' });
});

/*
 * @route   GET /
 * @desc    Get all Admin users
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.json(admins);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   POST /
 * @desc    Create a new Admin user
 * @access  Private (should be protected in a real application)
 */
router.post('/', async (req, res) => {
    console.log('✅ Admin service received POST / request');
    console.log('Received body:', req.body); // Add this line
  try {
    const { fullName, email, password } = req.body;

    // 1. Basic Validation: Check if required fields are provided
    if (!fullName || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // 2. Check if an admin with this email already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: 'Admin with this email already exists' });
    }

    // 3. Create a new admin instance
    admin = new Admin({
      fullName,
      email,
      password,
    });

    // 4. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);

    // 5. Save the new admin to the database
    await admin.save();

    // Respond with success message (don't send back the password)
    res.status(201).json({
      msg: 'Admin created successfully',
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        createdAt: admin.createdAt
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/*
 * @route   DELETE /:id
 * @desc    Delete an Admin user by ID
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found.' });
        }

        res.json({ msg: 'Admin removed successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
