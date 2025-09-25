const mongoose = require('mongoose')
const { Schema } = mongoose

const chargingSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'CarOwner',
      index: true
    },
    carId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      index: true
    },
    stationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Station',
      index: true
    },
    connectorId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    // Times
    startTime: { type: Date, required: true },
    endTime: { type: Date },

    // Metrics
    energyConsumedKWh: { type: Number, default: 0 }, // raw storage
    finalCost: { type: Number, default: 0 },         // raw storage
    durationMinutes: { type: Number, default: 0 },

    // Snapshot (for faster UI without extra populate)
    stationSnapshot: {
      stationName: String,
      address: Schema.Types.Mixed,
      connectorType: String,
      powerKW: Number
    },

    // Lifecycle status
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Completed', 'Cancelled', 'Error'],
      default: 'Completed'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Provide frontend-aligned aliases
        ret.id = ret._id
        ret.energyDelivered = ret.energyConsumedKWh
        ret.cost = ret.finalCost
        if (!ret.durationMinutes && ret.startTime && ret.endTime) {
          ret.durationMinutes = Math.max(
            0,
            Math.round(
              (new Date(ret.endTime).getTime() - new Date(ret.startTime).getTime()) / 60000
            )
          )
        }
        delete ret.__v
        return ret
      }
    }
  }
)

// Recalculate duration before save if endTime present
chargingSessionSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.durationMinutes = Math.max(
      0,
      Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000)
    )
  }
  next()
})

module.exports = mongoose.model('ChargingSession', chargingSessionSchema)
