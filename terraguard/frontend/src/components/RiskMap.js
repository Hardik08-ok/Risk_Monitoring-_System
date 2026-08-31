import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../utils/helpers';

// Fix Leaflet default icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

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

export default function RiskMap({ riskData, reports, onRegionClick }) {
  const mapRef    = useRef(null);
  const layerRef  = useRef(null);
  const reportRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    mapRef.current = L.map('terraguard-map', {
      center: [25.5, 92.5],
      zoom: 6,
      zoomControl: true,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 18,
    }).addTo(mapRef.current);

    // NER boundary box (approximate)
    L.rectangle([[21, 88], [29.5, 97.5]], {
      color: '#3b82f6', weight: 1.5, fill: false, dashArray: '6,4', opacity: 0.5,
    }).addTo(mapRef.current);

    layerRef.current  = L.layerGroup().addTo(mapRef.current);
    reportRef.current = L.layerGroup().addTo(mapRef.current);
  }, []);

  // Update risk markers
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

  // Update field report markers
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

  return (
    <div
      id="terraguard-map"
      style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
