import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getRiskColor, getScoreGradient } from '../utils/helpers';

export default function RiskFactorChart({ components, score, level, regionName }) {
  if (!components) return null;
  const color = getRiskColor(level);

  const radarData = [
    { factor: 'Rainfall',    value: Math.round(components.rainfall || 0) },
    { factor: 'Soil',        value: Math.round(components.soilMoisture || 0) },
    { factor: 'Slope',       value: Math.round(components.slopeGradient || 0) },
    { factor: 'Historical',  value: Math.round(components.historicalIndex || 0) },
    { factor: 'Reports',     value: Math.round(components.fieldReports || 0) },
  ];

  const barData = [
    { label: 'Rainfall',   value: Math.round(components.rainfall || 0),       weight: 30, color: '#3b82f6' },
    { label: 'Soil',       value: Math.round(components.soilMoisture || 0),    weight: 25, color: '#06b6d4' },
    { label: 'Slope',      value: Math.round(components.slopeGradient || 0),   weight: 20, color: '#7c3aed' },
    { label: 'Historical', value: Math.round(components.historicalIndex || 0), weight: 15, color: '#d97706' },
    { label: 'Reports',    value: Math.round(components.fieldReports || 0),    weight: 10, color: '#ea580c' },
  ];

  return (
    <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>RISK FACTOR CONTRIBUTION</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{regionName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>/ 100 — {level}</div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ResponsiveContainer width="50%" height={150}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="factor" tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }} />
            <Radar name="Risk" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Factor bars */}
        <div style={{ flex: 1 }}>
          {barData.map(item => (
            <div key={item.label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                <span>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700 }}>{item.value}%</span>
              </div>
              <div style={{ height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${item.value}%`, height: '100%', background: item.color,
                  borderRadius: 3, transition: 'width 0.7s',
                }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>
            <span style={{ color: '#d97706' }}>ALERT_STATUS: {score > 70 ? 'ACTIVE' : score > 45 ? 'WATCH' : 'NORMAL'}</span>
            <br />THRESHOLD: {'>'}70 = CRITICAL
          </div>
        </div>
      </div>
    </div>
  );
}
