/**
 * Sensor simulation — generates realistic real-time sensor data
 * In production: replace with actual IoT sensor API calls / NASA GPM IMERG feeds
 */
const { v4: uuidv4 } = require('uuid');
const regions = require('./data/regions');

// Simulate progressive weather event
let simulationTime = 0;

function generateSensorReading(region) {
  simulationTime += 0.05;
  const wave = Math.sin(simulationTime + region.lat) * 0.4 + 0.6;

  // Base values with realistic variance
  const rainfall = parseFloat((region.baseline.historicalIndex * 0.9 * wave + Math.random() * 20).toFixed(1));
  const soilMoisture = Math.min(98, parseFloat((region.baseline.soilMoisture * wave + Math.random() * 10).toFixed(1)));
  const riverLevel = parseFloat((2.5 + wave * 3.5 + Math.random()).toFixed(2));
  const windSpeed = parseFloat((15 + wave * 40 + Math.random() * 10).toFixed(1));
  const temperature = parseFloat((18 + Math.random() * 8).toFixed(1));

  return {
    sensorId: `SEN-${region.id}`,
    regionId: region.id,
    region: region.name,
    state: region.state,
    timestamp: new Date().toISOString(),
    readings: {
      rainfall_mmph: rainfall,
      soil_moisture_pct: soilMoisture,
      river_level_m: riverLevel,
      wind_speed_kmh: windSpeed,
      temperature_c: temperature,
      slope_angle_deg: region.terrain.slope,
    },
    status: rainfall > 80 ? 'ALERT' : rainfall > 40 ? 'WARNING' : 'NORMAL',
    source: 'IoT_Sensor_Grid',
  };
}

function getAllSensorReadings() {
  return regions.map(generateSensorReading);
}

function getSensorByRegion(regionId) {
  const region = regions.find(r => r.id === regionId);
  if (!region) return null;
  return generateSensorReading(region);
}

// Generate time-series history for charts
function getSensorHistory(regionId, hours = 24) {
  const region = regions.find(r => r.id === regionId);
  if (!region) return [];

  const history = [];
  const now = Date.now();
  const wave = Math.sin(region.lat) * 0.3 + 0.7;

  for (let i = hours; i >= 0; i--) {
    const t = (hours - i) / hours;
    const tWave = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    history.push({
      timestamp: new Date(now - i * 3600000).toISOString(),
      hour: `${String(new Date(now - i * 3600000).getHours()).padStart(2, '0')}:00`,
      rainfall: parseFloat((region.baseline.historicalIndex * 0.7 * tWave * wave + Math.random() * 15).toFixed(1)),
      soilMoisture: parseFloat((region.baseline.soilMoisture * (0.8 + tWave * 0.3) + Math.random() * 5).toFixed(1)),
      riskScore: Math.round(40 + tWave * 45 * wave + Math.random() * 10),
    });
  }
  return history;
}

module.exports = { getAllSensorReadings, getSensorByRegion, getSensorHistory };
