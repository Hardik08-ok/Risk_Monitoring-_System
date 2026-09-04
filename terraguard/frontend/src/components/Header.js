import React from 'react';
import { formatTime } from '../utils/helpers';

export default function Header({ liveData, onMenuClick }) {
  const { criticalCount, highCount, lastUpdate, loading, refresh } = liveData;

  return (
    <header className="tg-header" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderBottom: '1px solid #1e3a5f',
      padding: '0 20px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Left: hamburger (mobile only) + Logo + Title */}
      <div className="tg-header-left">
        {/* Hamburger — visible only on mobile via CSS */}
        <button
          className="tg-hamburger"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>🛡️</div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '0.02em' }}>
            TerraGuard <span style={{ color: '#60a5fa' }}>AI</span>
          </div>
          <div className="tg-header-subtitle" style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em' }}>
            DISASTER MANAGEMENT PLATFORM — NER
          </div>
        </div>
      </div>

      {/* Right: status badges + refresh */}
      <div className="tg-header-right">
        {criticalCount > 0 && (
          <div className="animate-pulse" style={{
            background: 'rgba(220,38,38,0.2)', border: '1px solid #dc2626',
            borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#fca5a5',
          }}>
            🔴 {criticalCount} CRITICAL
          </div>
        )}
        {highCount > 0 && (
          <div style={{
            background: 'rgba(234,88,12,0.2)', border: '1px solid #ea580c',
            borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#fdba74',
          }}>
            🟠 {highCount} HIGH
          </div>
        )}

        {/* Update time */}
        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading
            ? <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
            : <span style={{ color: '#22c55e' }}>●</span>}
          {lastUpdate ? `Updated ${formatTime(lastUpdate.toISOString())}` : 'Connecting…'}
        </div>

        {/* Refresh button */}
        <button onClick={refresh} title="Refresh data" style={{
          background: 'rgba(59,130,246,0.1)', border: '1px solid #1d4ed8',
          borderRadius: 6, padding: '4px 10px', color: '#60a5fa', fontSize: 12,
        }}>↻ Refresh</button>

        {/* Team Badge — hidden on mobile */}
        <div className="tg-header-teambadge" style={{
          background: 'rgba(124,58,237,0.15)', border: '1px solid #7c3aed',
          borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#a78bfa',
        }}>MDN-8492 | TerraGuard AI</div>
      </div>
    </header>
  );
}
