const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory report store (offline-first sync simulation)
let reports = [
  {
    id: uuidv4(),
    citizenId: 'CIT-001',
    regionId: 'R001',
    region: 'Gangtok, Sikkim',
    lat: 27.3380,
    lon: 88.6020,
    type: 'SLOPE_MOVEMENT',
    severity: 'HIGH',
    description: 'Visible slope cracks observed near NH10, 3km from Rangpo. Water seeping from hillside.',
    photoUrl: null,
    syncStatus: 'SYNCED',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    verified: true,
  },
  {
    id: uuidv4(),
    citizenId: 'CIT-002',
    regionId: 'R004',
    region: 'Kohima, Nagaland',
    lat: 25.6820,
    lon: 94.1150,
    type: 'ROAD_BLOCKAGE',
    severity: 'CRITICAL',
    description: 'Complete road blockage on NH29. Large debris fall. Emergency vehicles cannot pass.',
    photoUrl: null,
    syncStatus: 'SYNCED',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    verified: true,
  },
  {
    id: uuidv4(),
    citizenId: 'CIT-003',
    regionId: 'R003',
    region: 'Shillong, Meghalaya',
    lat: 25.5820,
    lon: 91.8970,
    type: 'FLOOD_WATER',
    severity: 'MODERATE',
    description: 'Rising water levels near Umkhrah river. Low-lying areas affected.',
    photoUrl: null,
    syncStatus: 'PENDING',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    verified: false,
  },
];

// GET /api/reports — all field reports
router.get('/', (req, res) => {
  res.json({ success: true, data: reports, count: reports.length });
});

// GET /api/reports/:regionId — reports by region
router.get('/region/:regionId', (req, res) => {
  const regionReports = reports.filter(r => r.regionId === req.params.regionId);
  res.json({ success: true, data: regionReports });
});

// POST /api/reports — submit field report (offline-first)
router.post('/', (req, res) => {
  const { regionId, region, lat, lon, type, severity, description, citizenId, offlineId } = req.body;

  if (!lat || !lon || !type) {
    return res.status(400).json({ error: 'lat, lon, and type are required' });
  }

  const report = {
    id: uuidv4(),
    offlineId: offlineId || null,
    citizenId: citizenId || 'ANONYMOUS',
    regionId: regionId || 'UNKNOWN',
    region: region || 'Unknown Region',
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    type,
    severity: severity || 'MODERATE',
    description: description || '',
    photoUrl: null,
    syncStatus: 'SYNCED',
    timestamp: new Date().toISOString(),
    verified: false,
  };

  reports.unshift(report);
  res.status(201).json({ success: true, data: report });
});

// PATCH /api/reports/:id/verify
router.patch('/:id/verify', (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  report.verified = true;
  report.verifiedAt = new Date().toISOString();
  res.json({ success: true, data: report });
});

// POST /api/reports/sync — batch sync offline reports
router.post('/sync', (req, res) => {
  const { offlineReports } = req.body;
  if (!Array.isArray(offlineReports)) {
    return res.status(400).json({ error: 'offlineReports must be an array' });
  }

  const synced = offlineReports.map(r => ({
    ...r,
    id: uuidv4(),
    syncStatus: 'SYNCED',
    syncedAt: new Date().toISOString(),
  }));

  reports = [...synced, ...reports];
  res.json({ success: true, synced: synced.length, data: synced });
});

module.exports = router;
