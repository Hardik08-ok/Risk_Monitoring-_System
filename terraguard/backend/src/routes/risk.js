const express = require('express');
const router = express.Router();
const { calculateRiskScore, getRiskColor } = require('../riskEngine');
const { getAllSensorReadings, getSensorByRegion } = require('../sensorSimulator');
const regions = require('../data/regions');


// GET /api/risk/all — risk scores for all regions
router.get('/all', (req, res) => {
  const sensorData = getAllSensorReadings();

  const results = sensorData.map(sensor => {
    const region = regions.find(r => r.id === sensor.regionId);
    const params = {
      rainfall: sensor.readings.rainfall_mmph,
      soilMoisture: sensor.readings.soil_moisture_pct,
      slopeGradient: sensor.readings.slope_angle_deg,
      historicalIndex: region?.baseline?.historicalIndex || 50,
      fieldReportCount: Math.floor(Math.random() * 8),
    };

    const risk = calculateRiskScore(params);
    return {
      regionId: sensor.regionId,
      region: sensor.region,
      state: sensor.state,
      lat: region?.lat,
      lon: region?.lon,
      ...risk,
      color: getRiskColor(risk.level),
      vulnerableAssets: region?.vulnerableAssets || 0,
      sensor: sensor.readings,
    };
  });

  res.json({ success: true, data: results, count: results.length });
});

// GET /api/risk/:regionId — detailed risk for a region
router.get('/:regionId', (req, res) => {
  const { regionId } = req.params;
  const region = regions.find(r => r.id === regionId);
  if (!region) return res.status(404).json({ error: 'Region not found' });

  const sensor = getSensorByRegion(regionId);
  const params = {
    rainfall: sensor.readings.rainfall_mmph,
    soilMoisture: sensor.readings.soil_moisture_pct,
    slopeGradient: sensor.readings.slope_angle_deg,
    historicalIndex: region.baseline.historicalIndex,
    fieldReportCount: Math.floor(Math.random() * 10),
  };

  const risk = calculateRiskScore(params);

  res.json({
    success: true,
    data: {
      region,
      risk: { ...risk, color: getRiskColor(risk.level) },
      sensor: sensor.readings,
    },
  });
});

// POST /api/risk/calculate — manual calculation with custom params
router.post('/calculate', (req, res) => {
  const params = req.body;
  if (!params) return res.status(400).json({ error: 'Parameters required' });

  const risk = calculateRiskScore(params);
  res.json({ success: true, data: risk });
});

module.exports = router;
