const express = require('express');
const router = express.Router();
const regions = require('../data/regions');

// GET /api/regions — all regions with metadata
router.get('/', (req, res) => {
  res.json({ success: true, data: regions, count: regions.length });
});

// GET /api/regions/:id — single region
router.get('/:id', (req, res) => {
  const region = regions.find(r => r.id === req.params.id);
  if (!region) return res.status(404).json({ error: 'Region not found' });
  res.json({ success: true, data: region });
});

module.exports = router;
