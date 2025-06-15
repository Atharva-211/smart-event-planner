const express = require('express');
const WeatherService = require('../services/weatherService');

const router = express.Router();
const weatherService = new WeatherService();

// Get weather for specific location and date
router.get('/:location/:date', async (req, res) => {
  try {
    const { location, date } = req.params;
    
    // Get coordinates for location
    const coords = await weatherService.getCoordinates(location);
    
    // Check if date is today or in the future
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestDate.getTime() === today.getTime()) {
      // Get current weather for today
      const weather = await weatherService.getCurrentWeather(coords.lat, coords.lon);
      res.json({
        location: coords.name,
        country: coords.country,
        date: requestDate,
        weather,
        type: 'current'
      });
    } else if (requestDate > today) {
      // Get forecast for future date
      const forecast = await weatherService.getForecast(coords.lat, coords.lon);
      const targetForecast = forecast.find(f => {
        const forecastDate = new Date(f.date);
        return forecastDate.toDateString() === requestDate.toDateString();
      });
      
      if (!targetForecast) {
        return res.status(404).json({ 
          error: 'Weather forecast not available for the requested date' 
        });
      }
      
      res.json({
        location: coords.name,
        country: coords.country,
        date: requestDate,
        weather: targetForecast,
        type: 'forecast'
      });
    } else {
      res.status(400).json({ 
        error: 'Cannot get weather data for past dates' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
