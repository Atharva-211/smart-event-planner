const express = require('express');
const Event = require('../models/Event');
const WeatherService = require('../services/weatherService');

const router = express.Router();
const weatherService = new WeatherService();

// Create event
router.post('/', async (req, res) => {
  try {
    const { name, location, date, eventType, description } = req.body;

    // Get coordinates for location
    const coords = await weatherService.getCoordinates(location);
    
    const event = new Event({
      name,
      location: coords.name,
      coordinates: { lat: coords.lat, lon: coords.lon },
      date: new Date(date),
      eventType,
      description
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort('-createdAt');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check weather for event
router.post('/:id/weather-check', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const currentWeather = await weatherService.getCurrentWeather(
      event.coordinates.lat, 
      event.coordinates.lon
    );

    const forecast = await weatherService.getForecast(
      event.coordinates.lat, 
      event.coordinates.lon
    );

    // Calculate suitability score
    const suitabilityScore = weatherService.calculateSuitabilityScore(
      currentWeather, 
      event.eventType
    );

    const recommendation = weatherService.getRecommendation(suitabilityScore);

    // Update event with weather analysis
    event.weatherAnalysis = {
      lastChecked: new Date(),
      currentWeather: {
        ...currentWeather,
        suitabilityScore,
        recommendation
      },
      forecast: forecast.slice(0, 5).map(f => ({
        ...f,
        suitabilityScore: weatherService.calculateSuitabilityScore(f, event.eventType)
      }))
    };

    await event.save();

    res.json({
      event: event.name,
      location: event.location,
      date: event.date,
      weather: event.weatherAnalysis,
      suitabilityLevel: weatherService.getSuitabilityLevel(suitabilityScore)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event suitability
router.get('/:id/suitability', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.weatherAnalysis || !event.weatherAnalysis.currentWeather) {
      return res.status(400).json({ 
        error: 'Weather analysis not available. Please run weather check first.' 
      });
    }

    const { suitabilityScore, recommendation } = event.weatherAnalysis.currentWeather;
    
    res.json({
      eventName: event.name,
      location: event.location,
      date: event.date,
      suitabilityScore,
      suitabilityLevel: weatherService.getSuitabilityLevel(suitabilityScore),
      recommendation,
      lastChecked: event.weatherAnalysis.lastChecked
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alternative dates
router.get('/:id/alternatives', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const forecast = await weatherService.getForecast(
      event.coordinates.lat, 
      event.coordinates.lon
    );

    // Group forecast by day and find best alternatives
    const dailyForecast = {};
    forecast.forEach(f => {
      const dateKey = f.date.toISOString().split('T')[0];
      if (!dailyForecast[dateKey] || f.temperature > dailyForecast[dateKey].temperature) {
        dailyForecast[dateKey] = f;
      }
    });

    const alternatives = Object.values(dailyForecast)
      .map(weather => ({
        date: weather.date,
        weather,
        suitabilityScore: weatherService.calculateSuitabilityScore(weather, event.eventType)
      }))
      .filter(alt => alt.suitabilityScore > 40) // Only suggest decent alternatives
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 3);

    res.json({
      originalEvent: {
        name: event.name,
        date: event.date,
        currentScore: event.weatherAnalysis?.currentWeather?.suitabilityScore || 0
      },
      alternatives: alternatives.map(alt => ({
        date: alt.date,
        suitabilityScore: alt.suitabilityScore,
        suitabilityLevel: weatherService.getSuitabilityLevel(alt.suitabilityScore),
        weather: {
          temperature: alt.weather.temperature,
          conditions: alt.weather.conditions,
          precipitation: alt.weather.precipitationProbability || 0,
          windSpeed: alt.weather.windSpeed
        },
        recommendation: weatherService.getRecommendation(alt.suitabilityScore)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;