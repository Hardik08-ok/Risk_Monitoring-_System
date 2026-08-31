import React, { useState } from 'react';
import { submitReport } from '../utils/api';
import { formatTime } from '../utils/helpers';

const REPORT_TYPES = [
  { value: 'SLOPE_MOVEMENT', label: '⛰️ Slope Movement', color: '#dc2626' },
  { value: 'ROAD_BLOCKAGE', label: '🚧 Road Blockage', color: '#ea580c' },
  { value: 'FLOOD_WATER', label: '🌊 Flood / Rising Water', color: '#3b82f6' },
  { value: 'LANDSLIDE', label: '🪨 Active Landslide', color: '#dc2626' },
  { value: 'CRACK_OBSERVED', label: '🔍 Ground Cracks', color: '#d97706' },
  { value: 'TREE_FALL', label: '🌲 Tree/Debris Fall', color: '#65a30d' },
  { value: 'BRIDGE_DAMAGE', label: '🌉 Bridge Damage', color: '#7c3aed' },
];

const SEVERITIES = [
  { value: 'CRITICAL', label: 'CRITICAL', color: '#dc2626' },
  { value: 'HIGH', label: 'HIGH', color: '#ea580c' },
  { value: 'MODERATE', label: 'MODERATE', color: '#d97706' },
  { value: 'LOW', label: 'LOW', color: '#65a30d' },
];

const OFFLINE_STORAGE_KEY = 'terraguard_offline_reports';

export default function FieldReporter({ liveData }) {
  const { reports, refresh } = liveData;
  const [form, setForm] = useState({ type: 'SLOPE_MOVEMENT', severity: 'HIGH', lat: '', lon: '', description: '', region: '', citizenId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [offline, setOffline]       = useState(false);
  const [offlineCount, setOfflineCount] = useState(
    () => JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]').length
  );
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setForm(prev => ({
        ...prev,
        lat: pos.coords.latitude.toFixed(6),
        lon: pos.coords.longitude.toFixed(6),
      })),
      () => setForm(prev => ({ ...prev, lat: '27.3314', lon: '88.6138' }))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.lat || !form.lon || !form.type) return;
    setSubmitting(true);

    if (offline) {
      // Offline-first: save locally
      const existing = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
      const newReport = { ...form, offlineId: `OFF-${Date.now()}`, savedAt: new Date().toISOString() };
      existing.unshift(newReport);
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existing));
      setOfflineCount(existing.length);
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      return;
    }

    try {
      await submitReport(form);
      setSubmitted(true);
      setForm(prev => ({ ...prev, lat: '', lon: '', description: '' }));
      setTimeout(() => { setSubmitted(false); refresh(); }, 2500);
    } catch {
      // Auto-save offline if API fails
      const existing = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
      existing.unshift({ ...form, offlineId: `OFF-${Date.now()}`, savedAt: new Date().toISOString() });
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existing));
      setOfflineCount(existing.length);
    }
    setSubmitting(false);
  }

  async function syncOffline() {
    setSyncing(true);
    const offline = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
    if (!offline.length) { setSyncing(false); return; }
    try {
      const resp = await fetch('/api/reports/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offlineReports: offline }),
      });
      const data = await resp.json();
      localStorage.setItem(OFFLINE_STORAGE_KEY, '[]');
      setOfflineCount(0);
      setSyncResult({ success: true, count: data.synced });
      setTimeout(() => setSyncResult(null), 3000);
      refresh();
    } catch {
      setSyncResult({ success: false });
    }
    setSyncing(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 88px)' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📱 Field Reporter</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Geo-tagged incident reporting — Offline-First Protocol</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {offlineCount > 0 && (
            <div style={{ fontSize: 12, color: '#fbbf24', background: 'rgba(217,119,6,0.2)', border: '1px solid #d97706', borderRadius: 6, padding: '4px 10px' }}>
              📦 {offlineCount} pending
            </div>
          )}
          <button onClick={syncOffline} disabled={syncing || offlineCount === 0} style={{
            background: offlineCount > 0 ? '#1d4ed8' : '#1e293b',
            border: `1px solid ${offlineCount > 0 ? '#3b82f6' : '#334155'}`,
            borderRadius: 6, padding: '6px 14px', color: offlineCount > 0 ? '#fff' : '#64748b',
            fontSize: 12, fontWeight: 600, cursor: offlineCount > 0 ? 'pointer' : 'default',
          }}>
            {syncing ? '⟳ Syncing…' : '⇑ Sync Offline Reports'}
          </button>
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className="slide-in" style={{
          background: syncResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.15)',
          border: `1px solid ${syncResult.success ? '#22c55e' : '#dc2626'}`,
          borderRadius: 6, padding: '8px 14px', fontSize: 12,
          color: syncResult.success ? '#4ade80' : '#fca5a5',
        }}>
          {syncResult.success ? `✓ ${syncResult.count} reports synced to backend` : '✗ Sync failed — reports saved locally'}
        </div>
      )}

      {/* Offline sync flow diagram */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>OFFLINE SYNC PROTOCOL</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
          <FlowBox label="📸 Upload geo-tagged photo" />
          <Arrow />
          <FlowBox label="🌐 Internet available?" diamond />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#22c55e' }}>YES →</span>
              <FlowBox label="Direct sync to API" color="#1d4ed8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#ea580c' }}>NO →</span>
              <FlowBox label="Encrypt & save locally" color="#d97706" />
              <Arrow />
              <FlowBox label="Background ping" color="#d97706" />
              <Arrow />
              <FlowBox label="Auto-sync on reconnect" color="#16a34a" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 12, minHeight: 0 }}>

        {/* Submission form */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Submit Field Report</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={offline} onChange={e => setOffline(e.target.checked)} style={{ cursor: 'pointer' }} />
              Offline Mode
            </label>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Incident type */}
            <div>
              <Label>Incident Type</Label>
              <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Severity */}
            <div>
              <Label>Severity</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                {SEVERITIES.map(s => (
                  <button type="button" key={s.value} onClick={() => setForm(p => ({ ...p, severity: s.value }))} style={{
                    flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: form.severity === s.value ? `${s.color}25` : '#334155',
                    border: `1px solid ${form.severity === s.value ? s.color : '#475569'}`,
                    color: form.severity === s.value ? s.color : '#64748b', cursor: 'pointer',
                  }}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label>GPS Location</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude" style={{ ...inputStyle, flex: 1 }} />
                <input name="lon" value={form.lon} onChange={handleChange} placeholder="Longitude" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={useMyLocation} style={{
                  background: '#1d4ed8', border: 'none', borderRadius: 6, padding: '0 10px', color: '#fff', fontSize: 12, cursor: 'pointer',
                }} title="Use my location">📍</button>
              </div>
            </div>

            {/* Region */}
            <div>
              <Label>Region / Locality</Label>
              <input name="region" value={form.region} onChange={handleChange} placeholder="e.g. Gangtok, Sikkim" style={inputStyle} />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Describe what you see: road damage, water levels, slope cracks…"
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Citizen ID */}
            <div>
              <Label>Reporter ID (optional)</Label>
              <input name="citizenId" value={form.citizenId} onChange={handleChange} placeholder="Your ID / phone" style={inputStyle} />
            </div>

            {submitted ? (
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: 6, padding: '10px', textAlign: 'center', color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
                ✓ Report {offline ? 'saved offline' : 'submitted successfully'}
              </div>
            ) : (
              <button type="submit" disabled={submitting || !form.lat || !form.lon} style={{
                background: '#1d4ed8', border: 'none', borderRadius: 7, padding: '11px',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: (!form.lat || !form.lon) ? 0.5 : 1,
              }}>
                {submitting ? '⟳ Submitting…' : offline ? '💾 Save Offline' : '📤 Submit Report'}
              </button>
            )}
          </form>
        </div>

        {/* Reports list */}
        <div style={{ overflow: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.06em' }}>
            RECENT FIELD REPORTS ({reports.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report: r }) {
  const colors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#d97706', LOW: '#65a30d' };
  const color = colors[r.severity] || '#64748b';

  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: `${color}20`, color, border: `1px solid ${color}50`, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
            {r.severity}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{r.type.replace(/_/g, ' ')}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
          <span style={{ color: r.syncStatus === 'SYNCED' ? '#22c55e' : '#d97706' }}>
            {r.syncStatus === 'SYNCED' ? '✓ Synced' : '⏳ Pending'}
          </span>
          <span style={{ color: r.verified ? '#22c55e' : '#64748b' }}>{r.verified ? '✓ Verified' : '○ Unverified'}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{r.description}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#475569' }}>
        <span>📍 {r.region}</span>
        <span>🌐 {r.lat?.toFixed(4)}, {r.lon?.toFixed(4)}</span>
        <span>🕐 {formatTime(r.timestamp)}</span>
        <span>👤 {r.citizenId}</span>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: '#334155', border: '1px solid #475569', borderRadius: 6,
  padding: '7px 10px', color: '#f1f5f9', fontSize: 12, outline: 'none',
};

function Label({ children }) {
  return <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 500 }}>{children}</div>;
}

function FlowBox({ label, color = '#1e3a5f', diamond = false }) {
  return (
    <div style={{
      background: `${color}30`, border: `1px solid ${color}80`,
      borderRadius: diamond ? '4px' : 6, padding: '5px 10px',
      fontSize: 10, color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap',
      transform: diamond ? 'rotate(0deg)' : 'none',
    }}>{label}</div>
  );
}

function Arrow() {
  return <span style={{ color: '#334155', fontSize: 14 }}>→</span>;
}
