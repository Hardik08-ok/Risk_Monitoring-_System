const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// ── Existing routes ───────────────────────────────────────────────────────────
app.use('/api/risk',    require('./routes/risk'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/alerts',  require('./routes/alerts'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/regions', require('./routes/regions'));

// ── Live Disasters route ──────────────────────────────────────────────────────
// GET /api/disasters?scope=global|india
//
// Aggregates live events from:
//   • USGS Earthquake Hazards GeoJSON all-day feed
//   • NASA EONET v3 open natural-events feed
//
// Normalises every event into:
//   { id, title, type, source, lat, lon, magnitude, severity, date, link }
//
// Supported types: EARTHQUAKE | FLOOD | WILDFIRE | SEVERE_STORM | VOLCANO | LANDSLIDE
// When scope=india, results are filtered to India's geographic bounding box.

(function mountDisastersRoute() {
  // ── Constants ───────────────────────────────────────────────────────────────
  const USGS_URL  = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200';
  const FETCH_TIMEOUT_MS = 10000;

  const INDIA = { minLat: 6.0, maxLat: 37.1, minLon: 68.0, maxLon: 98.0 };
  const inIndia = (lat, lon) =>
    lat >= INDIA.minLat && lat <= INDIA.maxLat &&
    lon >= INDIA.minLon && lon <= INDIA.maxLon;

  const EONET_TYPE_MAP = {
    'Wildfires':     'WILDFIRE',
    'Floods':        'FLOOD',
    'Severe Storms': 'SEVERE_STORM',
    'Volcanoes':     'VOLCANO',
    'Landslides':    'LANDSLIDE',
    'Earthquakes':   'EARTHQUAKE',
  };
  const SUPPORTED_TYPES = new Set(Object.values(EONET_TYPE_MAP));

  const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function earthquakeSeverity(mag) {
    if (mag == null)  return 'LOW';
    if (mag >= 7.0)   return 'CRITICAL';
    if (mag >= 5.5)   return 'HIGH';
    if (mag >= 4.0)   return 'MODERATE';
    return 'LOW';
  }

  function eonetSeverity(catTitle) {
    if (['Wildfires', 'Volcanoes', 'Severe Storms'].includes(catTitle)) return 'HIGH';
    if (['Floods', 'Landslides'].includes(catTitle))                     return 'MODERATE';
    return 'LOW';
  }

  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function normaliseUSGS(geojson) {
    return (geojson?.features ?? []).reduce((acc, f) => {
      const p   = f.properties ?? {};
      const geo = f.geometry;
      if (!geo || geo.type !== 'Point') return acc;
      const [lon, lat] = geo.coordinates;
      if (typeof lat !== 'number' || typeof lon !== 'number') return acc;
      const mag = typeof p.mag === 'number' ? p.mag : null;
      acc.push({
        id:        `usgs-${f.id}`,
        title:     p.place
          ? `M${mag != null ? mag.toFixed(1) : '?'} \u2013 ${p.place}`
          : (p.title ?? 'Earthquake'),
        type:      'EARTHQUAKE',
        source:    'USGS',
        lat, lon,
        magnitude: mag,
        severity:  earthquakeSeverity(mag),
        date:      p.time ? new Date(p.time).toISOString() : null,
        link:      p.url ?? null,
      });
      return acc;
    }, []);
  }

  function normaliseEONET(data) {
    return (data?.events ?? []).reduce((acc, ev) => {
      const catTitle = ev.categories?.[0]?.title ?? '';
      const typeName = EONET_TYPE_MAP[catTitle];
      if (!typeName || !SUPPORTED_TYPES.has(typeName)) return acc;

      // Most-recent Point geometry
      let lat = null, lon = null, date = null;
      for (const g of (ev.geometry ?? [])) {
        if (g.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
          lon  = g.coordinates[0];
          lat  = g.coordinates[1];
          date = g.date ?? null;
          break;
        }
      }
      if (lat == null || lon == null) return acc;

      const link = (ev.sources ?? []).find(s => s.url)?.url ?? null;
      acc.push({
        id:        `eonet-${ev.id}`,
        title:     ev.title ?? catTitle,
        type:      typeName,
        source:    'NASA EONET',
        lat, lon,
        magnitude: null,
        severity:  eonetSeverity(catTitle),
        date:      date ? new Date(date).toISOString() : null,
        link,
      });
      return acc;
    }, []);
  }

  // ── Handler ─────────────────────────────────────────────────────────────────
  app.get('/api/disasters', async (req, res) => {
    const scope = (req.query.scope ?? 'global').toLowerCase();

    const [usgsResult, eonetResult] = await Promise.allSettled([
      fetchWithTimeout(USGS_URL),
      fetchWithTimeout(EONET_URL),
    ]);

    const sourceErrors = [];
    let events = [];

    if (usgsResult.status === 'fulfilled') {
      try   { events.push(...normaliseUSGS(usgsResult.value)); }
      catch (e) { sourceErrors.push({ source: 'USGS', error: e.message }); }
    } else {
      sourceErrors.push({ source: 'USGS', error: usgsResult.reason?.message ?? 'Fetch failed' });
    }

    if (eonetResult.status === 'fulfilled') {
      try   { events.push(...normaliseEONET(eonetResult.value)); }
      catch (e) { sourceErrors.push({ source: 'NASA EONET', error: e.message }); }
    } else {
      sourceErrors.push({ source: 'NASA EONET', error: eonetResult.reason?.message ?? 'Fetch failed' });
    }

    if (scope === 'india') {
      events = events.filter(e => inIndia(e.lat, e.lon));
    }

    events.sort((a, b) => {
      const sd = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
      if (sd !== 0) return sd;
      return (b.date ?? '') > (a.date ?? '') ? 1 : -1;
    });

    res.json({
      success:      true,
      scope,
      count:        events.length,
      sourceErrors,
      fetchedAt:    new Date().toISOString(),
      data:         events,
    });
  });
})();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'TerraGuard AI Online', version: '2.0', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🛡️  TerraGuard AI Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
