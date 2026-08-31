import React from 'react';

export default function PipelineStatus({ riskData }) {
  const maxScore = riskData?.length ? Math.max(...riskData.map(r => r.score)) : 0;
  const avgScore = riskData?.length ? Math.round(riskData.reduce((s, r) => s + r.score, 0) / riskData.length) : 0;
  const threshold = 70;
  const isCritical = maxScore > threshold;

  const steps = [
    { label: 'Data Collection', sub: 'Sensors / Satellites / Field Apps', icon: '📡', status: 'ACQUIRING', color: '#3b82f6' },
    { label: 'Processing', sub: 'Data normalization', icon: '⚙️', status: 'IN PROGRESS', color: '#3b82f6' },
    { label: 'AI/ML Analysis', sub: 'Algorithmic assessment', icon: '🧠', status: 'ANALYZING', color: '#7c3aed' },
    { label: 'Risk Score', sub: `Output: ${maxScore} (${maxScore > 70 ? 'HIGH' : maxScore > 45 ? 'MOD' : 'LOW'})`, icon: '📊', status: isCritical ? 'ALERT' : 'NORMAL', color: isCritical ? '#dc2626' : '#d97706' },
    { label: 'GIS Map', sub: 'Spatial risk overlay', icon: '🗺️', status: 'PLOTTED', color: '#0891b2' },
    { label: 'Early Warning', sub: 'Targeted alerts', icon: '📣', status: isCritical ? 'DISPATCHED' : 'STANDBY', color: isCritical ? '#dc2626' : '#64748b' },
    { label: 'Action', sub: isCritical ? 'Evacuation initiated' : 'Monitoring', icon: '🚧', status: isCritical ? 'EXECUTING' : 'READY', color: isCritical ? '#dc2626' : '#64748b' },
  ];

  return (
    <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10 }}>
        COMMAND PIPELINE
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{
              flex: '0 0 auto', width: 100, textAlign: 'center',
              background: '#1e293b', borderRadius: 6, padding: '8px 6px',
              border: `1px solid ${step.color}40`,
            }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{step.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{step.label}</div>
              <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>{step.sub}</div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: step.color,
                background: `${step.color}20`, borderRadius: 3, padding: '1px 4px',
              }}>{step.status}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '0 2px',
                color: '#334155', fontSize: 12, flexShrink: 0,
              }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
