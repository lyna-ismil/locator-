const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

/*
 * @route   GET /health
 * @desc    Health check endpoint for the gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Review service is running.' });
});

/*
 * @route   POST /
 * @desc    Create a new review
 * @access  Private (for authenticated users)
 */
router.post('/', async (req, res) => {
    try {
        const { userId, stationId, rating, comment } = req.body;
        const newReview = new Review({ userId, stationId, rating, comment });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /
 * @desc    Get all reviews (can be filtered by stationId or userId)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Allows filtering like /reviews?stationId=someId
        const reviews = await Review.find(req.query).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   GET /:id
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }
        res.json(review);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   PUT /:id
 * @desc    Update a review
 * @access  Private (only the original user can update)
 */
router.put('/:id', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const updatedFields = { rating, comment };

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }
        res.json({ msg: 'Review updated successfully.', review });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
 * @route   DELETE /:id
 * @desc    Delete a review
 * @access  Private (user or admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }
        res.json({ msg: 'Review deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
