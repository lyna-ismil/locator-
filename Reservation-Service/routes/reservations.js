const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const axios = require('axios');

const GATEWAY_BASE = process.env.GATEWAY_URL || 'http://localhost:5000';

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Reservation service is running.' });
});

/* ---------- Helper Functions ---------- */
async function fetchCarOwner(userId) {
  const url = `${GATEWAY_BASE}/car-owners/profile/${userId}`;
  const r = await axios.get(url);
  const data = r.data;
  const normalized = data.user || data.carOwner || data;
  if (normalized && (normalized._id || normalized.id)) return normalized;
  throw new Error('Car owner not found.');
}

async function fetchStation(stationId) {
  const url = `${GATEWAY_BASE}/stations/${stationId}`;
  const stResp = await axios.get(url);
  const station = stResp.data;
  if (!station || !Array.isArray(station.connectors)) throw new Error('Station not found.');
  return station;
}

async function updateConnectorStatus(stationId, connectorId, status) {
  const url = `${GATEWAY_BASE}/stations/${stationId}/connectors/${connectorId}`
  try {
    const resp = await axios.patch(url, { status })
    console.log(`[reservations] PATCH connector ${connectorId} -> ${status} (HTTP ${resp.status})`)
  } catch (e) {
    // Surface station service error body if present
    const detail = e.response?.data || e.message
    console.warn(`[reservations] Failed connector status update ${url}:`, detail)
  }
}

/* ---------- Create Reservation ---------- */
router.post('/', async (req, res) => {
  try {
    const { userId, carId, stationId, connectorId, startTime, endTime } = req.body
    if (!userId || !stationId || !connectorId || !startTime || !endTime) {
      return res.status(400).json({ msg: 'Missing required fields.' })
    }

    // Log normalized times to catch timezone issues
    const sTime = new Date(startTime)
    const eTime = new Date(endTime)

    // Conflict check (unchanged logic)
    const conflicting = await Reservation.findOne({
      stationId,
      connectorId,
      status: { $in: ['Confirmed', 'Active'] },
      startTime: { $lt: eTime },
      endTime: { $gt: sTime },
    })
    if (conflicting) {
      return res.status(409).json({
        msg: 'This charging slot is already reserved.',
        conflict: {
          id: conflicting._id,
          startTime: conflicting.startTime,
            endTime: conflicting.endTime,
            status: conflicting.status
        }
      })
    }

    const [carOwner, station] = await Promise.all([
      fetchCarOwner(userId),
      fetchStation(stationId)
    ])

    // Broaden connector matching (frontend may send custom id)
    const connector = station.connectors.find(c =>
      String(c._id) === String(connectorId) ||
      String(c.id) === String(connectorId) ||
      String(c.connectorId) === String(connectorId)
    )
    if (!connector) {
      return res.status(404).json({
        msg: 'Connector not found.',
        requested: connectorId,
        available: station.connectors.map(c => c._id)
      })
    }

    const vehicle = carOwner.vehicleDetails || {}
    const newReservation = new Reservation({
      userId,
      carId,
      stationId,
      connectorId,
      startTime: sTime,
      endTime: eTime,
      expiresAt: sTime,
      status: 'Confirmed',
      customer: { name: carOwner.fullName, email: carOwner.email },
      vehicleInfo: { make: vehicle.make, model: vehicle.model, year: vehicle.year },
    })

    await newReservation.save()

    // Update connector to Unavailable
    await updateConnectorStatus(stationId, connectorId, 'Unavailable')

    res.status(201).json(newReservation)
  } catch (err) {
    console.error("[reservations] POST / error:", err.message)
    res.status(500).send('Server Error')
  }
});

/* ---------- List Reservations ---------- */
router.get('/', async (req, res) => {
  try {
    const query = {};
    const { userId, status } = req.query;
    if (userId) query.userId = userId;
    if (status) query.status = { $in: String(status).split(',') };

    const reservations = await Reservation.find(query)
      .populate('stationId', 'stationName address')
      .sort({ startTime: -1 });

    res.json(reservations);
  } catch (err) {
    console.error("[reservations] GET / error:", err.message);
    res.status(500).send('Server Error');
  }
});

/* ---------- Get Single Reservation ---------- */
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('stationId', 'stationName address')
      .populate('userId', 'fullName email');
    if (!reservation) return res.status(404).json({ msg: 'Reservation not found.' });
    res.json(reservation);
  } catch (err) {
    console.error("[reservations] GET /:id error:", err.message);
    res.status(500).send('Server Error');
  }
});

/* ---------- Update Reservation Status ---------- */
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ msg: 'Status is required.' });

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ msg: 'Reservation not found.' });

    if (['Cancelled', 'Completed', 'Expired'].includes(status)) {
      await updateConnectorStatus(reservation.stationId, reservation.connectorId, 'Available');
    }

    res.json({ msg: 'Reservation updated successfully.', reservation });
  } catch (err) {
    console.error("[reservations] PUT /:id error:", err.message);
    res.status(500).send('Server Error');
  }
});

/* ---------- Delete Reservation ---------- */
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ msg: 'Reservation not found.' });

    if (['Confirmed', 'Active'].includes(reservation.status)) {
      await updateConnectorStatus(reservation.stationId, reservation.connectorId, 'Available');
    }

    res.json({ msg: 'Reservation deleted successfully.' });
  } catch (err) {
    console.error("[reservations] DELETE /:id error:", err.message);
    res.status(500).send('Server Error');
  }
});

/* ---------- Background Status Transition Endpoint ---------- */
router.post('/update-statuses', async (req, res) => {
  const now = new Date();
  const gracePeriodMs = 15 * 60 * 1000;

  try {
    const activeResult = await Reservation.updateMany(
      { status: 'Confirmed', startTime: { $lte: now }, endTime: { $gt: now } },
      { $set: { status: 'Active' } }
    );

    const completedResult = await Reservation.updateMany(
      { status: 'Active', endTime: { $lte: now } },
      { $set: { status: 'Completed' } }
    );

    const expiredCutoff = new Date(now.getTime() - gracePeriodMs);
    const expiredResult = await Reservation.updateMany(
      { status: 'Confirmed', startTime: { $lt: expiredCutoff } },
      { $set: { status: 'Expired' } }
    );

    const toFree = await Reservation.find({
      status: { $in: ['Completed', 'Expired'] },
      endTime: { $lte: now }
    }).select('stationId connectorId');

    for (const r of toFree) {
      try {
        await updateConnectorStatus(r.stationId, r.connectorId, 'Available');
      } catch (e) {
        console.warn('[reservations] connector release failed for', r._id, e.message);
      }
    }

    res.status(200).json({
      message: 'Reservation statuses updated.',
      updatedToActive: activeResult.modifiedCount ?? activeResult.nModified ?? 0,
      updatedToCompleted: completedResult.modifiedCount ?? completedResult.nModified ?? 0,
      updatedToExpired: expiredResult.modifiedCount ?? expiredResult.nModified ?? 0,
      connectorsReleased: toFree.length
    });
  } catch (err) {
    console.error('Error updating reservation statuses:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;