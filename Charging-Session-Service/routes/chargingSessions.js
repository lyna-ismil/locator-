const express = require('express')
const router = express.Router()
const ChargingSession = require('../models/ChargingSession')

// Health
router.get('/health', (_req, res) =>
  res.status(200).json({ status: 'UP', message: 'Charging Session service is running.' })
)

// Format helper (uniform response shape)
function formatSession(doc) {
  if (!doc) return null
  const o = doc.toJSON ? doc.toJSON() : doc
  return {
    id: o._id || o.id,
    userId: o.userId,
    carId: o.carId,
    reservationId: o.reservationId,
    stationId: o.stationId,
    connectorId: o.connectorId,
    startTime: o.startTime,
    endTime: o.endTime,
    status: o.status,
    energyDelivered: o.energyDelivered ?? o.energyConsumedKWh ?? 0,
    cost: o.cost ?? o.finalCost ?? 0,
    duration: o.durationMinutes,
    stationSnapshot: o.stationSnapshot || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  }
}

// POST create (align with frontend fields)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      carId,
      stationId,
      connectorId,
      reservationId,
      startTime,
      endTime,
      energyDelivered,
      energyConsumedKWh,
      cost,
      finalCost,
      stationSnapshot
    } = req.body

    if (!userId || !carId || !stationId || !connectorId || !startTime) {
      return res.status(400).json({ msg: 'Missing required fields.' })
    }

    const sTime = new Date(startTime)
    const eTime = endTime ? new Date(endTime) : null
    if (isNaN(sTime.getTime())) return res.status(400).json({ msg: 'Invalid startTime.' })
    if (eTime && isNaN(eTime.getTime())) return res.status(400).json({ msg: 'Invalid endTime.' })
    if (eTime && eTime < sTime) return res.status(400).json({ msg: 'endTime before startTime.' })

    const session = new ChargingSession({
      userId,
      carId,
      stationId,
      connectorId,
      reservationId,
      startTime: sTime,
      endTime: eTime,
      energyConsumedKWh: energyDelivered ?? energyConsumedKWh ?? 0,
      finalCost: cost ?? finalCost ?? 0,
      stationSnapshot,
      status: eTime ? 'Completed' : 'Active'
    })

    await session.save()
    res.status(201).json(formatSession(session))
  } catch (e) {
    console.error('[charging-sessions] POST error:', e.message)
    res.status(500).json({ msg: 'Server Error' })
  }
})

// GET list with filters & pagination
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      stationId,
      reservationId,
      status,
      from,
      to,
      limit = 100,
      offset = 0
    } = req.query

    const query = {}
    if (userId) query.userId = userId
    if (stationId) query.stationId = stationId
    if (reservationId) query.reservationId = reservationId
    if (status) {
      const statuses = String(status)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (statuses.length) query.status = { $in: statuses }
    }
    if (from || to) {
      query.startTime = {}
      if (from) query.startTime.$gte = new Date(from)
      if (to) query.startTime.$lte = new Date(to)
    }

    const docs = await ChargingSession.find(query)
      .sort({ startTime: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 500))

    res.json(docs.map(formatSession))
  } catch (e) {
    console.error('[charging-sessions] GET list error:', e.message)
    res.status(500).json({ msg: 'Server Error' })
  }
})

// GET single
router.get('/:id', async (req, res) => {
  try {
    const doc = await ChargingSession.findById(req.params.id)
    if (!doc) return res.status(404).json({ msg: 'Charging session not found.' })
    res.json(formatSession(doc))
  } catch (e) {
    console.error('[charging-sessions] GET /:id error:', e.message)
    res.status(500).json({ msg: 'Server Error' })
  }
})

// PATCH update (end session / update metrics)
router.patch('/:id', async (req, res) => {
  try {
    const updates = {}
    const allowed = [
      'endTime',
      'energyDelivered',
      'energyConsumedKWh',
      'cost',
      'finalCost',
      'status',
      'stationSnapshot'
    ]
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    }

    if (updates.endTime) {
      const eTime = new Date(updates.endTime)
      if (isNaN(eTime.getTime()))
        return res.status(400).json({ msg: 'Invalid endTime.' })
      updates.endTime = eTime
      if (!updates.status) updates.status = 'Completed'
    }
    if (updates.energyDelivered !== undefined && updates.energyConsumedKWh === undefined) {
      updates.energyConsumedKWh = updates.energyDelivered
      delete updates.energyDelivered
    }
    if (updates.cost !== undefined && updates.finalCost === undefined) {
      updates.finalCost = updates.cost
      delete updates.cost
    }

    const doc = await ChargingSession.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    )
    if (!doc) return res.status(404).json({ msg: 'Charging session not found.' })
    res.json(formatSession(doc))
  } catch (e) {
    console.error('[charging-sessions] PATCH error:', e.message)
    res.status(500).json({ msg: 'Server Error' })
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const session = await ChargingSession.findByIdAndDelete(req.params.id)
    if (!session) return res.status(404).json({ msg: 'Charging session not found.' })
    res.json({ msg: 'Charging session deleted successfully.' })
  } catch (e) {
    console.error('[charging-sessions] DELETE error:', e.message)
    res.status(500).json({ msg: 'Server Error' })
  }
})

module.exports = router
