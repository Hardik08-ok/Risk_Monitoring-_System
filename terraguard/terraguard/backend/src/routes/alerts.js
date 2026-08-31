const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { calculateRiskScore, getRiskColor } = require('../riskEngine');
const { getAllSensorReadings } = require('../sensorSimulator');
const regions = require('../data/regions');

// In-memory alert store (production: use PostGIS/PostgreSQL)
let alerts = [];

// Seed initial alerts from live risk
function generateAlerts() {
  const sensorData = getAllSensorReadings();
  alerts = sensorData
    .map(sensor => {
      const region = regions.find(r => r.id === sensor.regionId);
      const params = {
        rainfall: sensor.readings.rainfall_mmph,
        soilMoisture: sensor.readings.soil_moisture_pct,
        slopeGradient: sensor.readings.slope_angle_deg,
        historicalIndex: region?.baseline?.historicalIndex || 50,
        fieldReportCount: Math.floor(Math.random() * 8),
      };
      const risk = calculateRiskScore(params);
      if (risk.score >= 45) {
        return {
          id: uuidv4(),
          regionId: sensor.regionId,
          region: sensor.region,
          state: sensor.state,
          level: risk.level,
          score: risk.score,
          alertStatus: risk.alertStatus,
          color: getRiskColor(risk.level),
          message: generateAlertMessage(risk.level, sensor.region, sensor.readings),
          channels: ['SMS', 'Dashboard', risk.score >= 70 ? 'Broadcast' : null].filter(Boolean),
          timestamp: new Date().toISOString(),
          acknowledged: false,
          action: risk.score >= 80 ? 'Initiate_Evacuation_Plan_B' : risk.score >= 65 ? 'Close_Road_Network_X7' : 'Monitor',
          targetAuthorities: ['District_Collector', 'SDMA', 'Emergency_Responders'],
        };
      }
      return null;
    })
    .filter(Boolean);
}

function generateAlertMessage(level, regionName, readings) {
  const msgs = {
    CRITICAL: `🔴 CRITICAL ALERT: Imminent landslide risk in ${regionName}. Rainfall ${readings.rainfall_mmph}mm/h, Soil saturation ${readings.soil_moisture_pct}%. Initiate evacuation immediately.`,
    HIGH: `🟠 HIGH RISK ALERT: Elevated landslide probability in ${regionName}. Rainfall ${readings.rainfall_mmph}mm/h. Road closures recommended.`,
    MODERATE: `🟡 WATCH: Moderate risk conditions in ${regionName}. Monitor conditions closely. Field teams on standby.`,
  };
  return msgs[level] || `ℹ️ Monitoring conditions in ${regionName}.`;
}

// Initialize
generateAlerts();

// GET /api/alerts — all active alerts
router.get('/', (req, res) => {
  generateAlerts(); // Refresh on each request
  res.json({ success: true, data: alerts, count: alerts.length });
});

// GET /api/alerts/critical — critical only
router.get('/critical', (req, res) => {
  const critical = alerts.filter(a => a.level === 'CRITICAL' || a.level === 'HIGH');
  res.json({ success: true, data: critical, count: critical.length });
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  res.json({ success: true, data: alert });
});

// POST /api/alerts/dispatch — trigger action dispatch
router.post('/dispatch', (req, res) => {
  const { alertId, action, authorities } = req.body;
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const dispatch = {
    dispatchId: uuidv4(),
    alertId,
    action,
    authorities: authorities || alert.targetAuthorities,
    status: 'DISPATCHED',
    timestamp: new Date().toISOString(),
  };

  res.json({ success: true, data: dispatch });
});

module.exports = router;
