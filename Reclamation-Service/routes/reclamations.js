const express = require('express');
const router = express.Router();
const Reclamation = require('../models/Reclamation');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Reclamation service is running.' });
});

/*
 * @route   POST /
 * @desc    Create a new reclamation ticket
 * @access  Private (for authenticated users)
 */
router.post('/', async (req, res) => {
    try {
        const { submittedBy, relatedStation, category, title, description } = req.body;

        // Basic validation
        if (!submittedBy || !category || !title || !description) {
            return res.status(400).json({ msg: 'SubmittedBy, category, title, and description are required.' });
        }

        const newReclamation = new Reclamation({
            submittedBy,
            relatedStation,
            category,
            title,
            description
        });

        await newReclamation.save();
        res.status(201).json(newReclamation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all reclamations
 * @access  Private (for Admins)
 */
router.get('/', async (req, res) => {
    try {
        const reclamations = await Reclamation.find().sort({ createdAt: -1 }); // Sort by newest first
        res.json(reclamations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /:id
 * @desc    Get a single reclamation by ID
 * @access  Private (for Admins)
 */
router.get('/:id', async (req, res) => {
    try {
        const reclamation = await Reclamation.findById(req.params.id);
        if (!reclamation) {
            return res.status(404).json({ msg: 'Reclamation not found.' });
        }
        res.json(reclamation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   PUT /:id
 * @desc    Update a reclamation (e.g., change status or add notes)
 * @access  Private (for Admins)
 */
router.put('/:id', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const updatedFields = {};
        if (status) updatedFields.status = status;
        if (adminNotes) updatedFields.adminNotes = adminNotes;

        const reclamation = await Reclamation.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        if (!reclamation) {
            return res.status(404).json({ msg: 'Reclamation not found.' });
        }

        res.json({ msg: 'Reclamation updated successfully.', reclamation });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   DELETE /:id
 * @desc    Delete a reclamation
 * @access  Private (for Admins)
 */
router.delete('/:id', async (req, res) => {
    try {
        const reclamation = await Reclamation.findByIdAndDelete(req.params.id);
        if (!reclamation) {
            return res.status(404).json({ msg: 'Reclamation not found.' });
        }
        res.json({ msg: 'Reclamation removed successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
