const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  async getCurrentWeather(lat, lon) {
    const cacheKey = `current_${lat}_${lon}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const weatherData = {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed * 3.6, // Convert m/s to km/h
        conditions: response.data.weather[0].main,
        description: response.data.weather[0].description,
        precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0,
        timestamp: new Date()
      };

      this.cache.set(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      throw new Error(`Weather API error: ${error.message}`);
    }
  }

  async getForecast(lat, lon) {
    const cacheKey = `forecast_${lat}_${lon}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const forecastData = response.data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temperature: item.main.temp,
        windSpeed: item.wind.speed * 3.6,
        conditions: item.weather[0].main,
        description: item.weather[0].description,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        precipitationProbability: item.pop * 100
      }));

      this.cache.set(cacheKey, forecastData);
      return forecastData;
    } catch (error) {
      throw new Error(`Forecast API error: ${error.message}`);
    }
  }

  async getCoordinates(locationName) {
    const cacheKey = `coords_${locationName}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl.replace('/data/2.5', '')}/geo/1.0/direct`, {
        params: {
          q: locationName,
          limit: 1,
          appid: this.apiKey
        }
      });

      if (response.data.length === 0) {
        throw new Error('Location not found');
      }

      const coords = {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        country: response.data[0].country
      };

      this.cache.set(cacheKey, coords);
      return coords;
    } catch (error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
  }

  calculateSuitabilityScore(weather, eventType) {
    let score = 0;
    const temp = weather.temperature;
    const precipitation = weather.precipitationProbability || 0;
    const wind = weather.windSpeed;

    // Event-specific scoring
    switch (eventType) {
      case 'outdoor_sports':
        // Temperature scoring (15-30°C ideal)
        if (temp >= 15 && temp <= 30) score += 30;
        else if (temp >= 10 && temp <= 35) score += 20;
        else if (temp >= 5 && temp <= 40) score += 10;

        // Precipitation scoring
        if (precipitation < 20) score += 25;
        else if (precipitation < 40) score += 15;
        else if (precipitation < 60) score += 5;

        // Wind scoring
        if (wind < 20) score += 20;
        else if (wind < 30) score += 10;
        else if (wind < 40) score += 5;

        // Condition scoring
        if (['Clear', 'Clouds'].includes(weather.conditions)) score += 25;
        else if (weather.conditions === 'Mist') score += 10;
        break;

      case 'wedding':
        // Temperature scoring (18-28°C ideal)
        if (temp >= 18 && temp <= 28) score += 30;
        else if (temp >= 15 && temp <= 32) score += 20;
        else if (temp >= 10 && temp <= 35) score += 10;

        // Precipitation scoring (more strict)
        if (precipitation < 10) score += 30;
        else if (precipitation < 20) score += 15;
        else if (precipitation < 30) score += 5;

        // Wind scoring
        if (wind < 15) score += 25;
        else if (wind < 25) score += 15;
        else if (wind < 35) score += 5;

        // Aesthetic weather bonus
        if (weather.conditions === 'Clear') score += 15;
        else if (weather.conditions === 'Clouds') score += 10;
        break;

      case 'hiking':
        // Temperature scoring (10-25°C ideal)
        if (temp >= 10 && temp <= 25) score += 30;
        else if (temp >= 5 && temp <= 30) score += 20;
        else if (temp >= 0 && temp <= 35) score += 10;

        // Precipitation scoring
        if (precipitation < 15) score += 25;
        else if (precipitation < 30) score += 15;
        else if (precipitation < 50) score += 5;

        // Wind scoring (moderate wind acceptable)
        if (wind < 25) score += 20;
        else if (wind < 35) score += 15;
        else if (wind < 45) score += 10;

        // Condition scoring
        if (['Clear', 'Clouds'].includes(weather.conditions)) score += 25;
        else if (weather.conditions === 'Mist') score += 15;
        break;

      default:
        // Generic outdoor event scoring
        if (temp >= 15 && temp <= 30) score += 25;
        if (precipitation < 20) score += 25;
        if (wind < 25) score += 25;
        if (['Clear', 'Clouds'].includes(weather.conditions)) score += 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  getRecommendation(score) {
    if (score >= 80) return 'Excellent conditions for your event!';
    if (score >= 60) return 'Good conditions with minor considerations';
    if (score >= 40) return 'Fair conditions - monitor weather closely';
    if (score >= 20) return 'Poor conditions - consider rescheduling';
    return 'Unsuitable conditions - strongly recommend rescheduling';
  }

  getSuitabilityLevel(score) {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Okay';
    return 'Poor';
  }
}

module.exports = WeatherService;
