import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../utils/helpers';

// Fix Leaflet default icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

// ── Risk marker ───────────────────────────────────────────────────────────────
function createRiskIcon(level, score) {
  const color = getRiskColor(level);
  const size  = level === 'CRITICAL' ? 36 : level === 'HIGH' ? 30 : 24;
  const pulse = level === 'CRITICAL' || level === 'HIGH';
  const html  = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${pulse ? `<div style="
        position:absolute;inset:0;border-radius:50%;
        border:2px solid ${color};
        animation:pulse-ring 1.4s ease-out infinite;
      "></div>` : ''}
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2px solid rgba(255,255,255,0.6);
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.35}px;font-weight:700;color:#fff;
        box-shadow:0 0 12px ${color}80;
      ">${score}</div>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

// ── Disaster marker ───────────────────────────────────────────────────────────
const DISASTER_META = {
  EARTHQUAKE:   { emoji: '🌍', color: '#f59e0b', label: 'Earthquake' },
  FLOOD:        { emoji: '🌊', color: '#3b82f6', label: 'Flood' },
  WILDFIRE:     { emoji: '🔥', color: '#ef4444', label: 'Wildfire' },
  SEVERE_STORM: { emoji: '🌪️', color: '#8b5cf6', label: 'Severe Storm' },
  VOLCANO:      { emoji: '🌋', color: '#f97316', label: 'Volcano' },
  LANDSLIDE:    { emoji: '⛰️', color: '#84cc16', label: 'Landslide' },
  OTHER:        { emoji: '⚠️', color: '#6b7280', label: 'Event' },
};

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MODERATE: '#d97706',
  LOW:      '#65a30d',
};

function createDisasterIcon(type, severity) {
  const meta  = DISASTER_META[type] ?? DISASTER_META.OTHER;
  const color = SEVERITY_COLORS[severity] ?? meta.color;
  const size  = severity === 'CRITICAL' ? 34 : severity === 'HIGH' ? 28 : 22;
  const pulse = severity === 'CRITICAL' || severity === 'HIGH';
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${pulse ? `<div style="
        position:absolute;inset:0;border-radius:4px;
        border:2px solid ${color};
        animation:pulse-ring 1.6s ease-out infinite;
      "></div>` : ''}
      <div style="
        width:${size}px;height:${size}px;border-radius:4px;
        background:${color}dd;border:1.5px solid rgba(255,255,255,0.55);
        display:flex;align-items:center;justify-content:center;
        font-size:${Math.round(size * 0.52)}px;
        box-shadow:0 0 10px ${color}70;
      ">${meta.emoji}</div>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function disasterPopup(ev) {
  const meta  = DISASTER_META[ev.type] ?? DISASTER_META.OTHER;
  const color = SEVERITY_COLORS[ev.severity] ?? meta.color;
  const dateStr = ev.date
    ? new Date(ev.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const magStr = ev.magnitude != null ? ev.magnitude.toFixed(1) : '—';
  const link   = ev.link
    ? `<a href="${ev.link}" target="_blank" rel="noreferrer"
         style="color:#60a5fa;font-size:10px;display:block;margin-top:6px;word-break:break-all;">
         View source ↗
       </a>`
    : '';
  return `
    <div style="min-width:210px;font-family:system-ui;background:#1e293b;color:#f1f5f9;border-radius:8px;overflow:hidden;">
      <div style="background:${color};padding:7px 12px;font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;">${meta.emoji}</span>
        <span>${meta.label} — ${ev.severity}</span>
      </div>
      <div style="padding:10px 12px;font-size:12px;">
        <div style="font-weight:600;color:#f1f5f9;margin-bottom:5px;line-height:1.35;">${ev.title}</div>
        <div style="color:#94a3b8;font-size:10px;margin-bottom:4px;">Source: ${ev.source}</div>
        ${ev.magnitude != null
          ? `<div style="color:#fbbf24;font-size:11px;margin-bottom:2px;">Magnitude: <b>${magStr}</b></div>`
          : ''}
        <div style="color:#94a3b8;font-size:10px;">🕐 ${dateStr}</div>
        ${link}
      </div>
    </div>`;
}

// ── Bounding boxes ─────────────────────────────────────────────────────────────
const WORLD_BOUNDS  = L.latLngBounds([-60, -180], [75, 180]);
const INDIA_BOUNDS  = L.latLngBounds([6, 68], [37.1, 98]);

// ────────────────────────────────────────────────────────────────────────────
// RiskMap
//
// Props (all optional except in risk mode):
//   mapMode        'risk' (default) | 'disasters'
//   riskData       array  – regional risk objects
//   reports        array  – field reports
//   onRegionClick  fn
//   disasterEvents array  – normalised disaster events
//   disasterScope  'global' | 'india'
// ────────────────────────────────────────────────────────────────────────────
export default function RiskMap({
  mapMode = 'risk',
  riskData,
  reports,
  onRegionClick,
  disasterEvents,
  disasterScope = 'global',
}) {
  const containerRef = useRef(null);
  const mapRef      = useRef(null);
  const layerRef    = useRef(null);   // risk markers
  const reportRef   = useRef(null);   // field report markers
  const disasterRef = useRef(null);   // disaster markers
  const nerBoxRef   = useRef(null);   // NER boundary rectangle
  const initialized = useRef(false);

  // ── One-time map initialization ─────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // A ref gives each mounted page its own map container. This prevents
    // Leaflet's "Map container is already initialized" error after switching
    // between the dashboard and Live Disasters pages.
    mapRef.current = L.map(containerRef.current, {
      center: [25.5, 92.5],
      zoom: 6,
      zoomControl: true,
    });

    const apiKey = process.env.REACT_APP_MAPTILER_KEY;
    if (apiKey) {
      const map = mapRef.current;
      import('@maptiler/leaflet-maptilersdk').then(({ MaptilerLayer, MapStyle, Language }) => {
        if (mapRef.current !== map) return;
        new MaptilerLayer({
          apiKey,
          style: MapStyle.STREETS.DARK,
          language: Language.ENGLISH,
        }).addTo(map);
      });
    } else {
      console.warn('[TerraGuard] REACT_APP_MAPTILER_KEY is not set. Falling back to OpenStreetMap tiles.');
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapRef.current);
    }

    // NER boundary box (shown only in risk mode)
    nerBoxRef.current = L.rectangle([[21, 88], [29.5, 97.5]], {
      color: '#3b82f6', weight: 1.5, fill: false, dashArray: '6,4', opacity: 0.5,
    }).addTo(mapRef.current);

    layerRef.current  = L.layerGroup().addTo(mapRef.current);
    reportRef.current = L.layerGroup().addTo(mapRef.current);
    disasterRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      reportRef.current = null;
      disasterRef.current = null;
      nerBoxRef.current = null;
      initialized.current = false;
    };
  }, []);

  // ── Toggle layers and fit bounds when mapMode/scope changes ─────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const isRisk      = mapMode === 'risk';
    const isDisasters = mapMode === 'disasters';

    // Show/hide the NER boundary box
    if (nerBoxRef.current) {
      if (isRisk) {
        if (!mapRef.current.hasLayer(nerBoxRef.current)) {
          nerBoxRef.current.addTo(mapRef.current);
        }
      } else {
        if (mapRef.current.hasLayer(nerBoxRef.current)) {
          mapRef.current.removeLayer(nerBoxRef.current);
        }
      }
    }

    // Show/hide risk & report layers
    if (layerRef.current) {
      if (isRisk) {
        if (!mapRef.current.hasLayer(layerRef.current)) layerRef.current.addTo(mapRef.current);
      } else {
        if (mapRef.current.hasLayer(layerRef.current))  mapRef.current.removeLayer(layerRef.current);
      }
    }
    if (reportRef.current) {
      if (isRisk) {
        if (!mapRef.current.hasLayer(reportRef.current)) reportRef.current.addTo(mapRef.current);
      } else {
        if (mapRef.current.hasLayer(reportRef.current))  mapRef.current.removeLayer(reportRef.current);
      }
    }

    // Show/hide disaster layer
    if (disasterRef.current) {
      if (isDisasters) {
        if (!mapRef.current.hasLayer(disasterRef.current)) disasterRef.current.addTo(mapRef.current);
      } else {
        if (mapRef.current.hasLayer(disasterRef.current))  mapRef.current.removeLayer(disasterRef.current);
      }
    }

    // Fit bounds to the active mode
    if (isRisk) {
      mapRef.current.setView([25.5, 92.5], 6);
    } else if (isDisasters) {
      mapRef.current.fitBounds(
        disasterScope === 'india' ? INDIA_BOUNDS : WORLD_BOUNDS,
        { padding: [20, 20] }
      );
    }
  }, [mapMode, disasterScope]);

  // ── Risk markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!layerRef.current || !riskData?.length) return;
    layerRef.current.clearLayers();

    riskData.forEach(r => {
      if (!r.lat || !r.lon) return;
      const marker = L.marker([r.lat, r.lon], { icon: createRiskIcon(r.level, r.score) });

      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui;background:#1e293b;color:#f1f5f9;border-radius:8px;overflow:hidden;">
          <div style="background:${r.color};padding:8px 12px;font-weight:700;font-size:13px;">
            ${r.level} RISK — ${r.region}
          </div>
          <div style="padding:10px 12px;">
            <div style="font-size:28px;font-weight:800;color:${r.color};margin-bottom:4px;">${r.score}<span style="font-size:14px;color:#94a3b8;">/100</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">${r.state} | Alert: ${r.alertStatus}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
              <div>🌧️ Rainfall: <b>${r.sensor?.rainfall_mmph?.toFixed(1) || '—'} mm/h</b></div>
              <div>💧 Soil: <b>${r.sensor?.soil_moisture_pct?.toFixed(0) || '—'}%</b></div>
              <div>⛰️ Slope: <b>${r.sensor?.slope_angle_deg || '—'}°</b></div>
              <div>🏠 Assets: <b>${r.vulnerableAssets}</b></div>
            </div>
          </div>
        </div>
      `, { maxWidth: 240 });

      marker.on('click', () => onRegionClick && onRegionClick(r));
      layerRef.current.addLayer(marker);
    });
  }, [riskData, onRegionClick]);

  // ── Field report markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!reportRef.current || !reports?.length) return;
    reportRef.current.clearLayers();

    reports.forEach(r => {
      const icon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;border-radius:3px;
          background:${r.severity === 'CRITICAL' ? '#dc2626' : r.severity === 'HIGH' ? '#ea580c' : '#d97706'};
          border:1px solid #fff;display:flex;align-items:center;justify-content:center;
          font-size:10px;color:#fff;font-weight:700;
        ">${r.type === 'ROAD_BLOCKAGE' ? '🚧' : r.type === 'FLOOD_WATER' ? '🌊' : '⚠️'}</div>`,
        className: '', iconSize: [18, 18], iconAnchor: [9, 9],
      });

      L.marker([r.lat, r.lon], { icon })
        .bindPopup(`<div style="font-size:12px;"><b>${r.type}</b><br/>${r.description}</div>`)
        .addTo(reportRef.current);
    });
  }, [reports]);

  // ── Disaster markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!disasterRef.current) return;
    disasterRef.current.clearLayers();
    if (!disasterEvents?.length) return;

    disasterEvents.forEach(ev => {
      if (typeof ev.lat !== 'number' || typeof ev.lon !== 'number') return;
      L.marker([ev.lat, ev.lon], { icon: createDisasterIcon(ev.type, ev.severity) })
        .bindPopup(disasterPopup(ev), { maxWidth: 260 })
        .addTo(disasterRef.current);
    });
  }, [disasterEvents]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
