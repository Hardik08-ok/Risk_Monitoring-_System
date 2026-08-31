import React from 'react';

const NAV = [
  { id: 'dashboard', icon: '🗺️', label: 'Live Dashboard' },
  { id: 'alerts',    icon: '🚨', label: 'Alert Center' },
  { id: 'reporter',  icon: '📱', label: 'Field Reporter' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar({ activePage, setPage, liveData }) {
  const { criticalCount, highCount, reports } = liveData;

  const badges = {
    alerts: criticalCount + highCount || null,
    reporter: reports.filter(r => !r.verified).length || null,
  };

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: '#111827',
      borderRight: '1px solid #1e293b',
      padding: '12px 0',
      display: 'flex', flexDirection: 'column', gap: 2,
      overflow: 'hidden',
    }}>
      {/* System Status */}
      <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #1e293b', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>SYSTEM STATUS</div>
        <StatusRow label="AI Engine" status="ONLINE" color="#22c55e" />
        <StatusRow label="Sensor Grid" status="ACTIVE" color="#22c55e" />
        <StatusRow label="GIS Layer" status="LIVE" color="#3b82f6" />
        <StatusRow label="SMS Gateway" status="READY" color="#a78bfa" />
      </div>

      {/* Navigation */}
      {NAV.map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 16px', textAlign: 'left', border: 'none',
          background: activePage === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
          borderLeft: activePage === item.id ? '3px solid #3b82f6' : '3px solid transparent',
          color: activePage === item.id ? '#60a5fa' : '#94a3b8',
          fontSize: 13, fontWeight: activePage === item.id ? 600 : 400,
          transition: 'all 0.15s',
          cursor: 'pointer', width: '100%',
        }}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {badges[item.id] && (
            <span style={{
              background: '#dc2626', color: '#fff', borderRadius: 10,
              fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center',
            }}>{badges[item.id]}</span>
          )}
        </button>
      ))}

      {/* Bottom: Pipeline status */}
      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>COMMAND PIPELINE</div>
        {['Collecting', 'Processing', 'Analyzing', 'Alerting'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{step}</span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: '#374151', marginTop: 8 }}>MDN-8492 | v2.0</div>
      </div>
    </aside>
  );
}

function StatusRow({ label, status, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.05em' }}>{status}</span>
    </div>
  );
}
