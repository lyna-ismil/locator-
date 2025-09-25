const express = require('express')
const router = express.Router()
const Station = require('../models/Station')
const mongoose = require('mongoose')
const axios = require('axios')
const { ALLOWED_CONNECTORS } = Station

function normalizeConnectorType(raw = "") {
  const r = raw.replace(/[\s_-]/g,"").toUpperCase()
  if (r === "MENNEKES") return "TYPE2"
  if (r === "J1772") return "TYPE1"
  if (r === "GBT") return "GB_T"
  if (ALLOWED_CONNECTORS.includes(r)) return r
  return null
}

function validateConnectors(list) {
  if (!Array.isArray(list) || !list.length) return "At least one connector required"
  for (const c of list) {
    if (!c.type || !ALLOWED_CONNECTORS.includes(String(c.type).toUpperCase()))
      return `Invalid connector type: ${c.type}`
    if (!c.chargerLevel) return "connector.chargerLevel required"
    if (c.powerKW == null || c.powerKW <= 0) return "connector.powerKW must be > 0"
    c.type = String(c.type).toUpperCase()
    c.status = c.status || "Available"
  }
  return null
}

function ensureDefaultConnector(body){
  if (!body.connectors || !Array.isArray(body.connectors) || body.connectors.length === 0){
    body.connectors = [{
      type: "TYPE2",
      chargerLevel: "AC Level 2",
      powerKW: 22,
      status: "Available"
    }]
  }
}

// POST / (owner adds station) — add logging + default connector + stronger validation
router.post('/', async (req,res) => {
  console.log('[stations] POST / payload:', JSON.stringify(req.body))
  try {
    const {
      stationName,
      network,
      location,
      ownerId: bodyOwnerId,
      email
    } = req.body
    const headerOwner = req.headers['x-owner-id']
    const ownerId = bodyOwnerId || headerOwner

    if (!stationName || !network || !location?.coordinates) {
      return res.status(400).json({ msg:'stationName, network, location required' })
    }
    if (!ownerId && !email) {
      return res.status(400).json({ msg:'ownerId or email required' })
    }

    // Normalize coordinates early
    if (location?.coordinates?.length === 2){
      const lng = Number(location.coordinates[0])
      const lat = Number(location.coordinates[1])
      if (!isFinite(lng) || !isFinite(lat)){
        return res.status(400).json({ msg:'coordinates must be numeric' })
      }
      req.body.location = { type:'Point', coordinates:[lng, lat] }
    }

    ensureDefaultConnector(req.body)
    const vErr = validateConnectors(req.body.connectors)
    if (vErr) return res.status(400).json({ msg: vErr })

    const station = await Station.create({
      ...req.body,
      ownerId: ownerId || req.body.ownerId
    })
    console.log('[stations] Created station id:', station._id.toString())
    res.status(201).json(station)
  } catch (e) {
    console.error('Create station error', e)
    res.status(500).json({ msg:'Server Error', error: e.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const filter = {}
    if (ownerId) filter.ownerId = ownerId
    const stations = await Station.find(filter).select('-password')
    res.json(stations)
  } catch (e) {
    console.error('List stations error', e)
    res.status(500).json({ msg:'Server Error' })
  }
})

router.get('/nearby', async (req,res) => {
  try {
    // Accept latitude/longitude or lat/lng
    const { latitude, longitude, lat, lng, radius, connectors } = req.query
    const latRaw = latitude ?? lat
    const lngRaw = longitude ?? lng
    if (latRaw == null || lngRaw == null) {
      return res.status(400).json({ msg:'lat/latitude and lng/longitude are required' })
    }
    const latNum = Number(latRaw)
    const lngNum = Number(lngRaw)
    if (!isFinite(latNum) || !isFinite(lngNum)) {
      return res.status(400).json({ msg:'Invalid coordinate values' })
    }
    let r = Number(radius) || 5000
    if (r > 50000) r = 50000

    const connectorTypes = connectors
      ? String(connectors).split(',').map(s=>s.trim()).filter(Boolean)
      : null

    const query = {
      location: {
        $near: {
          $geometry: { type:'Point', coordinates:[lngNum, latNum] },
          $maxDistance: r
        }
      }
    }
    if (connectorTypes?.length) {
      query['connectors.type'] = { $in: connectorTypes }
    }

    const results = await Station.find(query)
      .limit(300)
      .select('-password')
      .lean()

    res.json(results)
  } catch (e) {
    console.error('Nearby error', e)
    res.status(500).json({ msg:'Server Error' })
  }
})

router.get('/health', (_req, res) => {
  res.json({ status: 'UP', service: 'station-service' })
})

router.get('/:id', async (req,res) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid station id' })
  }
  try {
    const st = await Station.findById(id).select('-password')
    if (!st) return res.status(404).json({ msg:'Station not found.' })
    res.json(st)
  } catch (e) {
    console.error('Get station error', e)
    res.status(500).json({ msg:'Server Error' })
  }
})

router.put('/:id', async (req,res) => {
  try {
    if (req.body.connectors) {
      const err = validateConnectors(req.body.connectors)
      if (err) return res.status(400).json({ msg: err })
    }
    const st = await Station.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password')
    if (!st) return res.status(404).json({ msg:'Station not found.' })
    res.json({ msg:'Station updated successfully.', station: st })
  } catch (e) {
    console.error('Update error', e)
    res.status(500).json({ msg:'Server Error', error: e.message })
  }
})

router.delete('/:id', async (req,res) => {
  try {
    const st = await Station.findByIdAndDelete(req.params.id)
    if (!st) return res.status(404).json({ msg:'Station not found.' })
    res.json({ msg:'Station removed successfully.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ msg:'Server Error' })
  }
})

// Ensure a single exported list of allowed connector statuses
const ALLOWED_CONNECTOR_STATUSES = ["Available","Unavailable","InUse","OutOfOrder","Faulted"]

// PATCH: update single connector status (expanded to accept 'Unavailable' etc. + better matching & logging)
router.patch('/:stationId/connectors/:connectorId', async (req, res) => {
  const { stationId, connectorId } = req.params
  const { status } = req.body

  if (!status) return res.status(400).json({ msg: 'Status is required.' })
  if (!ALLOWED_CONNECTOR_STATUSES.includes(status)) {
    return res.status(400).json({
      msg: `Invalid status. Allowed: ${ALLOWED_CONNECTOR_STATUSES.join(', ')}`,
      received: status
    })
  }

  try {
    const station = await Station.findById(stationId)
    if (!station) return res.status(404).json({ msg: 'Station not found.' })

    // Try subdocument _id first
    let connector = station.connectors.id(connectorId)

    // Fallback: match by custom id or connectorId field if you store it
    if (!connector) {
      connector = station.connectors.find(c =>
        String(c._id) === String(connectorId) ||
        String(c.id) === String(connectorId) ||
        String(c.connectorId) === String(connectorId)
      )
    }
    if (!connector) {
      return res.status(404).json({
        msg: 'Connector not found.',
        connectorId,
        availableConnectorIds: station.connectors.map(c => c._id)
      })
    }

    connector.status = status
    await station.save()

    console.log(`[stations] Connector ${connectorId} @ station ${stationId} -> ${status}`)
    res.json({ msg: 'Connector status updated.', connector })
  } catch (e) {
    console.error('Update connector status error', e)
    res.status(500).json({ msg: 'Server Error', error: e.message })
  }
})

router.post('/signup', async (req,res) => {
  console.log('[stations] POST /signup payload:', JSON.stringify(req.body))
  try {
    const { email, password, stationName, network, location } = req.body
    if (!email || !password) return res.status(400).json({ msg:'email & password required' })
    if (!stationName || !network || !location?.coordinates)
      return res.status(400).json({ msg:'stationName, network, location required' })

    req.body.ownerId = req.body.ownerId || email
    // coords normalize
    const coords = location.coordinates
    if (!Array.isArray(coords) || coords.length !==2) return res.status(400).json({ msg:'location.coordinates must be [lng,lat]' })
    const lng = Number(coords[0]), lat = Number(coords[1])
    if (!isFinite(lng) || !isFinite(lat)) return res.status(400).json({ msg:'coordinates must be numbers' })
    req.body.location = { type:'Point', coordinates:[lng, lat] }

    if (!req.body.connectors || !req.body.connectors.length) {
      req.body.connectors = [{
        type:"TYPE2",
        chargerLevel:"AC Level 2",
        powerKW:22,
        status:"Available"
      }]
    }

    const vErr = validateConnectors(req.body.connectors)
    if (vErr) return res.status(400).json({ msg:vErr })

    console.log('[stations] POST /signup inserting email:', req.body.email)
    const st = await Station.create(req.body)
    res.status(201).json(st)
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ msg:'Email already registered.' })
    }
    console.error('Signup error', e)
    res.status(500).json({ msg:'Server Error', error:e.message })
  }
})

router.post('/signin', async (req,res) => {
  try {
    let { email, password } = req.body
    if (!email || !password) return res.status(400).json({ msg:'email & password required' })
    email = email.toLowerCase().trim()

    const st = await Station.findOne({ email }).select('+password')
    if (!st) return res.status(401).json({ msg:'Invalid credentials.' })
    if (st.password !== password) return res.status(401).json({ msg:'Invalid credentials.' })

    const obj = st.toObject()
    delete obj.password
    res.json({ msg:'Login successful', station: obj })
  } catch (e) {
    console.error('Signin error', e)
    res.status(500).json({ msg:'Server Error' })
  }
})

router.get('/with-owners', async (req, res) => {
  try {
    // Fetch all stations
    const stations = await Station.find({}).lean();

    // Group stations by owner (using email and ownerId from the station itself)
    const ownersMap = {};
    stations.forEach(station => {
      // Use email as unique key for owner
      const ownerKey = station.email || station.ownerId;
      if (!ownerKey) return;

      if (!ownersMap[ownerKey]) {
        ownersMap[ownerKey] = {
          id: ownerKey,
          name: station.ownerId || "Unknown Owner", // If you store name, use it here
          email: station.email,
          stations: [],
        };
      }
      ownersMap[ownerKey].stations.push(station.stationName || "Unnamed Station");
    });

    res.json(Object.values(ownersMap));
  } catch (e) {
    console.error('Error fetching stations with owners:', e);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router