import React from 'react';
import { getRiskColor, formatTime } from '../utils/helpers';
import { acknowledgeAlert } from '../utils/api';

export default function AlertPanel({ alerts, onRefresh }) {
  const sorted = [...alerts].sort((a, b) => b.score - a.score);

  async function handleAck(id) {
    await acknowledgeAlert(id).catch(() => {});
    onRefresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'auto' }}>
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 32, fontSize: 13 }}>
          ✅ No active alerts
        </div>
      )}
      {sorted.map(alert => {
        const color = getRiskColor(alert.level);
        return (
          <div key={alert.id} className="slide-in" style={{
            background: '#1e293b', border: `1px solid ${color}50`,
            borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '12px 14px',
            opacity: alert.acknowledged ? 0.55 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: `${color}25`, color, border: `1px solid ${color}60`,
                    borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                  }}>{alert.level}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9' }}>{alert.region}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Score: {alert.score}/100</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>{alert.message}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {alert.channels?.map(ch => (
                    <span key={ch} style={{
                      background: '#334155', color: '#94a3b8', borderRadius: 4,
                      padding: '1px 7px', fontSize: 10, fontWeight: 500,
                    }}>{ch}</span>
                  ))}
                  <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
                {alert.action && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#fbbf24', fontFamily: 'monospace' }}>
                    EXECUTE: {alert.action}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 10 }}>
                {!alert.acknowledged && (
                  <button onClick={() => handleAck(alert.id)} style={{
                    background: 'rgba(59,130,246,0.15)', border: '1px solid #1d4ed8',
                    borderRadius: 5, padding: '3px 8px', color: '#60a5fa', fontSize: 11, cursor: 'pointer',
                  }}>ACK</button>
                )}
                {alert.acknowledged && (
                  <span style={{ fontSize: 10, color: '#22c55e' }}>✓ Acknowledged</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
