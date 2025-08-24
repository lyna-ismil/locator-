const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Notification service is running.' });
});

/*
 * @route   POST /
 * @desc    Create a new notification
 * @access  Private (typically called by other services)
 */
router.post('/', async (req, res) => {
    try {
        const newNotification = new Notification(req.body);
        await newNotification.save();
        res.status(201).json(newNotification);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all notifications, optionally filtered by userId
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // Build a query object. If a userId is present in the query string, filter by it.
        const query = req.query.userId ? { userId: req.query.userId } : {};
        
        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   PUT /:id/read
 * @desc    Mark a notification as read
 * @access  Private (for the logged-in user)
 */
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found.' });
        }
        res.json({ msg: 'Notification marked as read.', notification });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   DELETE /:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found.' });
        }
        res.json({ msg: 'Notification deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;