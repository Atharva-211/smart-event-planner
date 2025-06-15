const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  date: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['outdoor_sports', 'wedding', 'hiking', 'corporate_outing', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  weatherAnalysis: {
    lastChecked: Date,
    currentWeather: {
      temperature: Number,
      humidity: Number,
      precipitation: Number,
      windSpeed: Number,
      conditions: String,
      suitabilityScore: Number,
      recommendation: String
    },
    forecast: [{
      date: Date,
      temperature: Number,
      precipitation: Number,
      windSpeed: Number,
      conditions: String,
      suitabilityScore: Number
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);