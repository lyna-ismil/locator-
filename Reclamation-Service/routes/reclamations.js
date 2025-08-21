const express = require('express');
const router = express.Router();
const Reclamation = require('../models/Reclamation');
const mongoose = require('mongoose');

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
    const payload = { ...req.body }

    // sanitize relatedStation: if it's a 24-char hex string, convert to ObjectId
    if (payload.relatedStation && typeof payload.relatedStation === 'string') {
      const s = payload.relatedStation.trim()
      if (/^[0-9a-fA-F]{24}$/.test(s)) {
        payload.relatedStation = mongoose.Types.ObjectId(s)
      } else {
        // keep string (name) — stored as string in model (mixed)
        payload.relatedStation = s
      }
    }

    const rec = new Reclamation(payload)
    await rec.save()
    res.status(201).json(rec)
  } catch (err) {
    console.error('Create reclamation error', err)
    res.status(500).json({ msg: 'Reclamation creation failed', error: err.message })
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
