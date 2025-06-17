# Smart Event Planner - Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed  
- MongoDB Atlas account (or local MongoDB)  
- OpenWeatherMap API key  
- Railway account for deployment  

---

## 🛠 1. Project Setup

```bash
mkdir smart-event-planner
cd smart-event-planner
npm init -y

# Install runtime dependencies
npm install express mongoose axios cors dotenv helmet express-rate-limit node-cache moment

# Install dev dependencies
npm install --save-dev nodemon jest
```

---

## 🔐 2. Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-planner?retryWrites=true&w=majority
OPENWEATHER_API_KEY=your_openweather_api_key_here
PORT=3000
NODE_ENV=development
```

---

## 🌤 3. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)  
2. Create a free account and navigate to the API Keys section  
3. Copy your key and paste it in `.env` under `OPENWEATHER_API_KEY`  

---

## 🌐 4. MongoDB Atlas Setup

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)  
2. Create a free cluster and database user  
3. Whitelist your IP (or use `0.0.0.0/0` for open access)  
4. Copy the connection URI and set it in `.env`  

---

## 💻 5. Local Development

```bash
npm run dev   # Development
npm start     # Production
```

> App runs at: `http://localhost:3000`

---

## 🚂 Railway Deployment

### Step 1: Prepare

Ensure the following:

- `.env` is configured  
- `start` script is present in `package.json`

### Step 2: Deploy

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Step 3: Environment Variables in Railway

Add these in Railway Dashboard → Project → Variables:

- `MONGODB_URI`
- `OPENWEATHER_API_KEY`
- `PORT` = `3000`
- `NODE_ENV` = `production`

---

## 📁 Project Structure

```
smart-event-planner/
├── models/
│   └── Event.js
├── routes/
│   ├── events.js
│   └── weather.js
├── services/
│   └── weatherService.js
├── middleware/
│   └── errorHandler.js
├── server.js
├── .env
├── package.json
├── railway.toml
└── README.md
```

---

## 🧪 Postman Testing

### Import Collection

1. Open Postman
2. Click "Import" → Choose your Postman collection JSON
3. Update collection variables:
   - `baseUrl` = `http://localhost:3000/api`
   - `railway_url` = your deployed Railway URL

### Test Sequence

1. Run all **Create Event** requests  
2. Copy Event IDs from the responses  
3. Use those IDs in:
   - Weather Check
   - Suitability Check
   - Alternative Date Suggestions  
4. Test error scenarios

---

## 🔧 API Endpoints Reference

### Event Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/events` | Create new event |
| GET    | `/api/events` | List all events |
| PUT    | `/api/events/:id` | Update event |
| POST   | `/api/events/:id/weather-check` | Analyze weather for the event |
| GET    | `/api/events/:id/suitability` | Get weather suitability score |
| GET    | `/api/events/:id/alternatives` | Suggest alternative dates |

### Weather

- `GET /api/weather/:location/:date` → Get weather for specific date and location

### Health Check

- `GET /health` → Confirm API is running

---

## 🧠 Scoring Algorithm

### Outdoor Sports
- Temperature: 15–30°C → 30 points  
- Precipitation: <20% → 25 points  
- Wind Speed: <20 km/h → 20 points  
- Conditions: Clear or partly cloudy → 25 points

### Wedding
- Temperature: 18–28°C → 30 points  
- Precipitation: <10% → 30 points  
- Wind Speed: <15 km/h → 25 points  
- Clear skies bonus → 15 points

### Hiking
- Temperature: 10–25°C → 30 points  
- Precipitation: <15% → 25 points  
- Wind Speed: <25 km/h → 20 points  
- Clear/cloudy acceptable → 25 points

### Suitability Levels

| Score     | Level       |
|-----------|-------------|
| 80–100    | Excellent   |
| 60–79     | Good        |
| 40–59     | Fair        |
| 20–39     | Poor        |
| 0–19      | Unsuitable  |

---

## 🛠️ Troubleshooting

### Common Issues

- **MongoDB**: Check `.env`, credentials, and IP access  
- **Weather API**: Check key, format, and rate limit  
- **404 Errors**: Use full path `/api/weather/...` not just `/weather/...`

### Debugging Tips

```bash
railway logs
curl http://localhost:3000/health
curl "https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=YOUR_API_KEY"
```

---

## 📊 Performance

- Weather data cached for 1 hour
- Coordinates cached indefinitely
- 100 requests / 15 min (rate-limited)
- Mongoose schemas enforce validation
- Graceful error responses

---

## 🔐 Security

- `helmet` for HTTP security headers  
- `cors` for API access  
- `express-rate-limit` for throttling  
- No sensitive info in logs or API responses

---

## 📈 Monitoring

- `/health` endpoint used for uptime checks  
- Logs via Railway CLI (`railway logs`)

---

## 🚀 Future Features

- Email notifications for bad weather  
- Historical data comparison  
- Venue suggestion by weather  
- User authentication system  
- React/Next.js frontend  
- React Native mobile app

---

## ✅ Setup Checklist

- [x] All dependencies installed  
- [x] `.env` configured  
- [x] MongoDB Atlas working  
- [x] Weather API key added  
- [x] App runs locally and on Railway  
- [x] Postman tests imported and executed  
- [x] Weather scoring logic functioning  
