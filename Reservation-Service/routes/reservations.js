const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const axios = require("axios");
require("../../station-service/models/Station"); // Adjust path if needed

const GATEWAY_BASE = process.env.GATEWAY_URL || "http://localhost:5000";

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "Reservation service is running." });
});

/* ---------- Helper Functions ---------- */
async function fetchCarOwner(userId) {
  const url = `${GATEWAY_BASE}/car-owners/profile/${userId}`;
  const r = await axios.get(url);
  const data = r.data;
  const normalized = data.user || data.carOwner || data;
  if (normalized && (normalized._id || normalized.id)) return normalized;
  throw new Error("Car owner not found.");
}

async function fetchStation(stationId) {
  const url = `${GATEWAY_BASE}/stations/${stationId}`;
  const stResp = await axios.get(url);
  const station = stResp.data;
  if (!station || !Array.isArray(station.connectors))
    throw new Error("Station not found.");
  return station;
}

async function updateConnectorStatus(stationId, connectorId, status) {
  const url = `${GATEWAY_BASE}/stations/${stationId}/connectors/${connectorId}`;
  try {
    const resp = await axios.patch(url, { status });
    console.log(
      `[reservations] PATCH connector ${connectorId} -> ${status} (HTTP ${resp.status})`,
    );
  } catch (e) {
    // Surface station service error body if present
    const detail = e.response?.data || e.message;
    console.warn(`[reservations] Failed connector status update ${url}:`, detail);
  }
}

/* ---------- Utility: enrich reservations with connector info ---------- */
function enrichWithConnectorInfo(reservation) {
  if (!reservation) return reservation
  // Work on plain object (avoid mutating Mongoose internals in-place)
  const obj = typeof reservation.toObject === "function" ? reservation.toObject() : reservation
  const station = obj.stationId
  if (station && station.connectors && obj.connectorId) {
    const cid = String(obj.connectorId)
    const connector =
      station.connectors.find(
        c =>
          String(c._id) === cid ||
          String(c.id) === cid ||
          String(c.connectorId) === cid
      ) || null
    if (connector) {
      obj.connectorInfo = {
        id: connector._id || connector.id || connector.connectorId,
        type: connector.type,
        status: connector.status,
        chargerLevel: connector.chargerLevel,
        powerKW: connector.powerKW,
      }
      // Optional: if frontend expects flattened fields add them (uncomment if needed)
      // obj.connectorType = connector.type
      // obj.connectorStatus = connector.status
    } else {
      obj.connectorInfo = null
    }
  }
  return obj
}

function enrichArray(list) {
  return Array.isArray(list) ? list.map(enrichWithConnectorInfo) : list
}

/* ---------- Create Reservation (enhanced) ---------- */
router.post("/", async (req, res) => {
  try {
    const { userId, carId, stationId, connectorId, startTime, endTime } = req.body;
    if (!userId || !stationId || !connectorId || !startTime || !endTime) {
      return res.status(400).json({ msg: "Missing required fields." });
    }

    const sTime = new Date(startTime);
    const eTime = new Date(endTime);
    if (isNaN(sTime.getTime()) || isNaN(eTime.getTime()) || eTime <= sTime) {
      return res.status(400).json({ msg: "Invalid time range." });
    }

    const conflicting = await Reservation.findOne({
      stationId,
      connectorId,
      status: { $in: ["Confirmed", "Active"] },
      startTime: { $lt: eTime },
      endTime: { $gt: sTime },
    });
    if (conflicting) {
      return res.status(409).json({
        msg: "This charging slot is already reserved.",
        conflict: {
          id: conflicting._id,
          startTime: conflicting.startTime,
          endTime: conflicting.endTime,
          status: conflicting.status,
        },
      });
    }

    const [carOwner, station] = await Promise.all([
      fetchCarOwner(userId),
      fetchStation(stationId),
    ]);

    const connector = station.connectors.find(
      (c) => String(c._id) === String(connectorId)
    );
    if (!connector) {
      console.log("Looking for connectorId:", connectorId);
      console.log("Available connectors:", station.connectors.map(c => ({
        _id: c._id,
        id: c.id,
        connectorId: c.connectorId
      })));
      return res.status(404).json({
        msg: "Connector not found.",
        requested: connectorId,
        available: station.connectors.map((c) => c._id),
      });
    }

    const vehicle = carOwner.vehicleDetails || {};
    const doc = new Reservation({
      userId,
      carId,
      stationId,
      connectorId,
      startTime: sTime,
      endTime: eTime,
      expiresAt: sTime,
      status: "Confirmed",
      customer: { name: carOwner.fullName, email: carOwner.email },
      vehicleInfo: { make: vehicle.make, model: vehicle.model, year: vehicle.year },
    });

    await doc.save();
    await updateConnectorStatus(stationId, connectorId, "Unavailable");

    // FIX: Pass the station data directly to the document for enrichment
    const enriched = enrichWithConnectorInfo({
      ...doc.toObject(),
      stationId: station, // This will be used by the enrich function
    });

    // NEW: send owner notification (if station has ownerId)
    try {
      const ownerId =
        station.ownerId ||
        station.owner ||
        station.owner?._id;
      if (ownerId) {
        await axios.post(`${GATEWAY_BASE}/notifications`, {
          userId: ownerId,
          type: "reservation.created",
          title: "New Reservation",
          message: `${carOwner.fullName || "A driver"} reserved a connector at ${station.stationName || "your station"}.`,
          reservationId: doc._id,
          stationId: stationId,
          status: "Confirmed",
        }).catch(()=>{});
      }
    } catch(e) {
      console.warn("[reservations] owner notification (create) failed:", e.message);
    }

    res.status(201).json(enriched);
  } catch (err) {
    console.error("[reservations] POST / error:", err.message);
    res.status(500).send("Server Error");
  }
});

/* ---------- List Reservations (enhanced with connector & station filtering) ---------- */
router.get("/", async (req, res) => {
  try {
    const { userId, status, populate, stationId, stationIds } = req.query;
    const query = {};
    if (userId) query.userId = userId;

    // NEW: stationId / stationIds support for owner dashboards
    let stationFilter = [];
    if (stationId) stationFilter.push(String(stationId));
    if (stationIds) {
      stationFilter = stationFilter.concat(
        String(stationIds)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      );
    }
    if (stationFilter.length === 1) query.stationId = stationFilter[0];
    else if (stationFilter.length > 1) query.stationId = { $in: stationFilter };

    if (status) {
      const list = String(status)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      if (list.length) query.status = { $in: list };
    }

    let q = Reservation.find(query).sort({ startTime: -1 });
    if (!populate || String(populate).split(",").includes("stationId")) {
      q = q.populate("stationId", "stationName address connectors ownerId");
    }

    const reservations = await q.exec();
    res.json(enrichArray(reservations));
  } catch (err) {
    console.error("[reservations] GET / error:", err.message);
    res.status(500).send("Server Error");
  }
});

/* ---------- Get Single Reservation (with connector info) ---------- */
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("stationId", "stationName address connectors")
      .populate("userId", "fullName email");
    if (!reservation) return res.status(404).json({ msg: "Reservation not found." });
    res.json(enrichWithConnectorInfo(reservation));
  } catch (err) {
    console.error("[reservations] GET /:id error:", err.message);
    res.status(500).send("Server Error");
  }
});

/* ---------- Update Reservation Status (re-populate + connector info) ---------- */
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const ALLOWED = ["Confirmed", "Active", "Completed", "Cancelled", "Expired"];
    if (!status) return res.status(400).json({ msg: "Status is required." });
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Allowed: ${ALLOWED.join(", ")}` });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true },
    ).populate("stationId", "stationName address connectors");

    if (!reservation)
      return res.status(404).json({ msg: "Reservation not found." });

    if (["Cancelled", "Completed", "Expired"].includes(status)) {
      await updateConnectorStatus(
        reservation.stationId,
        reservation.connectorId,
        "Available",
      );
    }

    // NEW: notify owner on completion / cancellation
    try {
      const st = reservation.stationId;
      const ownerId = st && st.ownerId;
      if (ownerId && ["Completed","Cancelled","Expired"].includes(status)) {
        await axios.post(`${GATEWAY_BASE}/notifications`, {
          userId: ownerId,
          type: `reservation.${status.toLowerCase()}`,
          title: `Reservation ${status}`,
          message: `A reservation at ${st.stationName || "your station"} is now ${status}.`,
          reservationId: reservation._id,
          stationId: st._id || st.id,
          status,
        }).catch(()=>{});
      }
    } catch(e) {
      console.warn("[reservations] owner notification (status) failed:", e.message);
    }

    res.json({
      msg: "Reservation updated successfully.",
      reservation: enrichWithConnectorInfo(reservation),
    });
  } catch (err) {
    console.error("[reservations] PUT /:id error:", err.message);
    res.status(500).send("Server Error");
  }
});

/* ---------- Delete Reservation ---------- */
router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation)
      return res.status(404).json({ msg: "Reservation not found." });

    if (["Confirmed", "Active"].includes(reservation.status)) {
      await updateConnectorStatus(
        reservation.stationId,
        reservation.connectorId,
        "Available",
      );
    }

    res.json({ msg: "Reservation deleted successfully." });
  } catch (err) {
    console.error("[reservations] DELETE /:id error:", err.message);
    res.status(500).send("Server Error");
  }
});

/* ---------- Background Status Transition Endpoint ---------- */
router.post("/update-statuses", async (req, res) => {
  const now = new Date();
  const gracePeriodMs = 15 * 60 * 1000;

  try {
    const activeResult = await Reservation.updateMany(
      { status: "Confirmed", startTime: { $lte: now }, endTime: { $gt: now } },
      { $set: { status: "Active" } },
    );

    const completedResult = await Reservation.updateMany(
      { status: "Active", endTime: { $lte: now } },
      { $set: { status: "Completed" } },
    );

    const expiredCutoff = new Date(now.getTime() - gracePeriodMs);
    const expiredResult = await Reservation.updateMany(
      { status: "Confirmed", startTime: { $lt: expiredCutoff } },
      { $set: { status: "Expired" } },
    );

    const toFree = await Reservation.find({
      status: { $in: ["Completed", "Expired"] },
      endTime: { $lte: now },
    }).select("stationId connectorId");

    for (const r of toFree) {
      try {
        await updateConnectorStatus(r.stationId, r.connectorId, "Available");
      } catch (e) {
        console.warn(
          "[reservations] connector release failed for",
          r._id,
          e.message,
        );
      }
    }

    res.status(200).json({
      message: "Reservation statuses updated.",
      updatedToActive: activeResult.modifiedCount ?? activeResult.nModified ?? 0,
      updatedToCompleted:
        completedResult.modifiedCount ?? completedResult.nModified ?? 0,
      updatedToExpired:
        expiredResult.modifiedCount ?? expiredResult.nModified ?? 0,
      connectorsReleased: toFree.length,
    });
  } catch (err) {
    console.error("Error updating reservation statuses:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;