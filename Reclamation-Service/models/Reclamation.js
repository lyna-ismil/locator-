const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reclamationSchema = new Schema({
  submittedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'CarOwner' // reference the user model
  },
  // CHANGED: relatedStation is now an ObjectId ref to Station
  relatedStation: {
    type: Schema.Types.ObjectId,
    ref: 'Station'
  },
  category: {
    type: String,
    required: true,
    enum: ["Incorrect Station Info", "Broken Charger", "Billing Issue", "General Feedback"]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open"
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reclamation', reclamationSchema);
