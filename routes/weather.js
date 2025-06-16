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

    // Normalize request and today's date
    const requestDate = new Date(date);
    requestDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compare by date only (not time)
    if (requestDate.toDateString() === today.toDateString()) {
      const weather = await weatherService.getCurrentWeather(coords.lat, coords.lon);
      return res.json({
        location: coords.name,
        country: coords.country,
        date: requestDate,
        weather,
        type: 'current'
      });
    }

    if (requestDate < today) {
      return res.status(400).json({ error: 'Cannot get weather data for past dates' });
    }

    // Limit to next 14 days (based on typical API capabilities)
    const maxForecastDays = 14;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxForecastDays);

    if (requestDate > maxDate) {
      return res.status(400).json({
        error: `Forecast data is only available for up to ${maxForecastDays} days from today`
      });
    }

    // Get forecast and find match for requestDate
    const forecast = await weatherService.getForecast(coords.lat, coords.lon);

    const targetForecast = forecast.find(f => {
      const forecastDate = new Date(f.date);
      return forecastDate.toDateString() === requestDate.toDateString();
    });

    if (!targetForecast) {
      return res.status(200).json({
        message: 'Forecast data not available for the requested date',
        date: requestDate,
        location: coords.name
      });
    }

    res.json({
      location: coords.name,
      country: coords.country,
      date: requestDate,
      weather: targetForecast,
      type: 'forecast'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
