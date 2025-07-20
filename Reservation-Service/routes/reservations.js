const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Reservation service is running.' });
});

/*
 * @route   POST /
 * @desc    Create a new reservation after checking for conflicts
 * @access  Private (for authenticated users)
 */
router.post('/', async (req, res) => {
    try {
        const { userId, carId, stationId, connectorId, startTime, endTime } = req.body;

        // --- Conflict Checking Logic ---
        const conflictingReservation = await Reservation.findOne({
            stationId,
            connectorId,
            status: { $in: ['Confirmed', 'Active'] }, // Check against active or confirmed bookings
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        });

        if (conflictingReservation) {
            return res.status(409).json({ msg: 'This charging slot is already reserved for the requested time.' });
        }

        // --- Create New Reservation ---
        const newReservation = new Reservation({
            userId,
            carId,
            stationId,
            connectorId,
            startTime,
            endTime
        });

        await newReservation.save();
        res.status(201).json(newReservation);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all reservations (e.g., for an admin or by user)
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // In a real app, you'd filter by userId from an authenticated token
        const reservations = await Reservation.find(req.query).sort({ startTime: -1 });
        res.json(reservations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /:id
 * @desc    Get a single reservation by its ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found.' });
        }
        res.json(reservation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/*
 * @route   PUT /:id
 * @desc    Update a reservation's status or details
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body; // Add other fields like startTime/endTime if you allow rescheduling

        const updatedFields = {};
        if (status) updatedFields.status = status;
        
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found.' });
        }

        res.json({ msg: 'Reservation updated successfully.', reservation });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/*
 * @route   DELETE /:id
 * @desc    Delete a reservation
 * @access  Private (for Admins)
 */
router.delete('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found.' });
        }

        res.json({ msg: 'Reservation deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
