import React from 'react';
import { getRiskColor, getRiskBg, getScoreGradient } from '../utils/helpers';

export default function RiskCard({ region, score, level, alertStatus, vulnerableAssets, sensor, onClick }) {
  const color = getRiskColor(level);
  const bg    = getRiskBg(level);

  return (
    <div onClick={onClick} style={{
      background: '#1e293b', border: `1px solid ${color}40`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: '12px', cursor: 'pointer',
      transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#263347'}
      onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
    >
      {/* Region + Level */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>{region}</div>
        </div>
        <span style={{
          background: bg, color, border: `1px solid ${color}60`,
          borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
        }}>{level}</span>
      </div>

      {/* Risk score gauge */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Risk Score</span>
          <span style={{ fontSize: 20, fontWeight: 800, color }}>{score}</span>
        </div>
        <div style={{ height: 5, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: getScoreGradient(score), borderRadius: 3, transition: 'width 0.6s' }} />
        </div>
      </div>

      {/* Sensor mini-stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
        <MiniStat icon="🌧️" label={`${sensor?.rainfall_mmph?.toFixed(1) ?? '—'} mm/h`} />
        <MiniStat icon="💧" label={`${sensor?.soil_moisture_pct?.toFixed(0) ?? '—'}% soil`} />
        <MiniStat icon="⛰️" label={`${sensor?.slope_angle_deg ?? '—'}° slope`} />
        <MiniStat icon="🏘️" label={`${vulnerableAssets ?? '—'} assets`} />
      </div>

      {/* Alert status dot */}
      {alertStatus === 'ACTIVE' && (
        <div className="animate-pulse" style={{
          position: 'absolute', top: 8, right: 8, width: 7, height: 7,
          borderRadius: '50%', background: color,
        }} />
      )}
    </div>
  );
}

function MiniStat({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
      <span>{icon}</span><span>{label}</span>
    </div>
  );
}
