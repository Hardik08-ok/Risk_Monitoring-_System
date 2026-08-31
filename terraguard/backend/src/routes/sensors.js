const express = require('express');
const router = express.Router();
const { getAllSensorReadings, getSensorByRegion, getSensorHistory } = require('../sensorSimulator');

// GET /api/sensors — all sensor readings
router.get('/', (req, res) => {
  const data = getAllSensorReadings();
  res.json({ success: true, data, count: data.length });
});

// GET /api/sensors/:regionId — single sensor
router.get('/:regionId', (req, res) => {
  const data = getSensorByRegion(req.params.regionId);
  if (!data) return res.status(404).json({ error: 'Sensor not found' });
  res.json({ success: true, data });
});

// GET /api/sensors/:regionId/history — time-series data
router.get('/:regionId/history', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const data = getSensorHistory(req.params.regionId, hours);
  res.json({ success: true, data, count: data.length });
});

module.exports = router;
