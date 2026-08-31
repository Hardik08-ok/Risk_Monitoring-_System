import React, { useState } from 'react';
import AlertPanel from '../components/AlertPanel';
import { getRiskColor } from '../utils/helpers';
import { dispatchAction } from '../utils/api';

export default function AlertsPage({ liveData }) {
  const { alerts, refresh } = liveData;
  const [filter, setFilter] = useState('ALL');
  const [dispatchLog, setDispatchLog] = useState([]);

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.level === filter);

  const criticalAlerts  = alerts.filter(a => a.level === 'CRITICAL');
  const highAlerts      = alerts.filter(a => a.level === 'HIGH');
  const activeAlerts    = alerts.filter(a => !a.acknowledged);

  async function handleDispatch(alert) {
    const result = await dispatchAction({ alertId: alert.id, action: alert.action }).catch(() => null);
    if (result) {
      setDispatchLog(prev => [result, ...prev.slice(0, 9)]);
    }
  }

  const levels = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE'];
  const levelColors = { ALL: '#3b82f6', CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#d97706' };
  const levelCounts = { ALL: alerts.length, CRITICAL: criticalAlerts.length, HIGH: highAlerts.length, MODERATE: alerts.filter(a => a.level === 'MODERATE').length };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 88px)' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>🚨 Alert Center</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Real-time escalation & dispatch — North Eastern India</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeAlerts.length > 0 && (
            <div className="animate-pulse" style={{
              background: 'rgba(220,38,38,0.2)', border: '1px solid #dc2626',
              borderRadius: 6, padding: '6px 14px', color: '#fca5a5', fontWeight: 700, fontSize: 13,
            }}>
              ⚠️ {activeAlerts.length} Unacknowledged
            </div>
          )}
        </div>
      </div>

      {/* Alert Escalation Funnel — visual */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '14px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.06em' }}>
          ALERT ESCALATION PROTOCOL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <FunnelStep icon="🌐" label="AI Risk" sublabel={`${alerts.length} regions`} color="#3b82f6" />
          <Arrow />
          <FunnelStep icon="🔍" label="Threshold Check" sublabel=">70 = Critical" color="#7c3aed" />
          <Arrow />
          <FunnelStep icon="⚠️" label="Warning Generated" sublabel="Multilingual" color="#d97706" />
          <Arrow />
          <div style={{
            background: 'rgba(220,38,38,0.2)', border: '2px solid #dc2626',
            borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 130,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>📨 SMS & DASHBOARD</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>Dispatched to local authorities</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{criticalAlerts.length}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs + alert list */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {levels.map(l => (
              <button key={l} onClick={() => setFilter(l)} style={{
                background: filter === l ? `${levelColors[l]}25` : '#1e293b',
                border: `1px solid ${filter === l ? levelColors[l] : '#334155'}`,
                borderRadius: 6, padding: '5px 12px', color: filter === l ? levelColors[l] : '#64748b',
                fontSize: 12, fontWeight: filter === l ? 700 : 400, cursor: 'pointer',
              }}>
                {l} ({levelCounts[l]})
              </button>
            ))}
          </div>

          {/* Alerts */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <AlertPanel alerts={filtered} onRefresh={refresh} />
          </div>
        </div>

        {/* Dispatch log */}
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: 12, overflow: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>DISPATCH LOG</div>
          {/* Quick dispatch buttons */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>QUICK DISPATCH:</div>
            {criticalAlerts.slice(0, 3).map(a => (
              <button key={a.id} onClick={() => handleDispatch(a)} style={{
                display: 'block', width: '100%', background: 'rgba(220,38,38,0.15)',
                border: '1px solid #dc262640', borderRadius: 5, padding: '6px 8px',
                color: '#fca5a5', fontSize: 11, textAlign: 'left', cursor: 'pointer', marginBottom: 4,
              }}>
                🚨 Dispatch → {a.region}
              </button>
            ))}
            {criticalAlerts.length === 0 && (
              <div style={{ fontSize: 11, color: '#374151' }}>No critical alerts</div>
            )}
          </div>

          {/* Log entries */}
          {dispatchLog.length === 0 && (
            <div style={{ fontSize: 11, color: '#374151' }}>No dispatches yet</div>
          )}
          {dispatchLog.map((d, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 5, padding: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>✓ {d.status}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.action}</div>
              <div style={{ fontSize: 9, color: '#475569' }}>{new Date(d.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ icon, label, sublabel, color }) {
  return (
    <div style={{
      background: `${color}15`, border: `1px solid ${color}50`,
      borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 110,
    }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9' }}>{label}</div>
      <div style={{ fontSize: 9, color: '#64748b' }}>{sublabel}</div>
    </div>
  );
}

function Arrow() {
  return <div style={{ color: '#334155', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>→</div>;
}
