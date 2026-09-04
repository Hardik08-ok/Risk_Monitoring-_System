import React, { useState } from 'react';
import RiskMap from '../components/RiskMap';
import RiskCard from '../components/RiskCard';
import PipelineStatus from '../components/PipelineStatus';
import SensorChart from '../components/SensorChart';
import RiskFactorChart from '../components/RiskFactorChart';
import { fetchRisk } from '../utils/api';
import { useDisasters } from '../hooks/useLiveData';

export default function Dashboard({ liveData }) {
  const { riskData, alerts, reports, loading } = liveData;
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionDetail,   setRegionDetail]   = useState(null);

  const criticalCount = riskData.filter(r => r.level === 'CRITICAL').length;
  const highCount     = riskData.filter(r => r.level === 'HIGH').length;
  const avgScore      = riskData.length ? Math.round(riskData.reduce((s, r) => s + r.score, 0) / riskData.length) : 0;

  async function handleRegionSelect(r) {
    setSelectedRegion(r);
    const detail = await fetchRisk(r.regionId).catch(() => null);
    if (detail) setRegionDetail(detail);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#64748b' }}>
      <span className="animate-spin" style={{ fontSize: 24, display: 'inline-block' }}>⟳</span>
      <span>Initializing TerraGuard AI…</span>
    </div>
  );

  return (
    <div className="tg-dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 88px)' }}>

      {/* KPI Row — 5 cols desktop, 2 cols mobile */}
      <div className="tg-kpi-grid">
        <KPI label="Regions Monitored" value={riskData.length}                               icon="🗺️" color="#3b82f6" />
        <KPI label="Critical Zones"    value={criticalCount}                                  icon="🔴" color="#dc2626" alert />
        <KPI label="High Risk Zones"   value={highCount}                                      icon="🟠" color="#ea580c" />
        <KPI label="Avg Risk Score"    value={avgScore}                                       icon="📊" color="#d97706" />
        <KPI label="Active Alerts"     value={alerts.filter(a => !a.acknowledged).length}    icon="🚨" color="#ea580c" />
      </div>

      {/* Pipeline */}
      <PipelineStatus riskData={riskData} />

      {/* Main grid: map + side panel */}
      <div className="tg-dashboard-grid">

        {/* Map */}
        <div className="tg-map-wrap">
          <RiskMap riskData={riskData} reports={reports} onRegionClick={handleRegionSelect} />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>

          {selectedRegion && regionDetail && (
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, border: '1px solid #334155', flexShrink: 0 }}>
              <RiskFactorChart
                components={regionDetail.risk?.components}
                score={regionDetail.risk?.score}
                level={regionDetail.risk?.level}
                regionName={selectedRegion.region}
              />
              <div style={{ marginTop: 10 }}>
                <SensorChart
                  regionId={selectedRegion.regionId}
                  regionName={selectedRegion.region}
                  level={selectedRegion.level}
                />
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
            ALL REGIONS — CLICK TO INSPECT
          </div>
          {[...riskData]
            .sort((a, b) => b.score - a.score)
            .map(r => (
              <RiskCard key={r.regionId} {...r} onClick={() => handleRegionSelect(r)} />
            ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon, color, alert }) {
  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: 8, padding: '10px 12px',
      ...(alert && value > 0 ? { animation: 'blink 2s infinite' } : {}),
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</div>
        </div>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LiveDisastersPage
// ═══════════════════════════════════════════════════════════════════════════════

const DISASTER_TYPE_META = {
  EARTHQUAKE:   { emoji: '🌍', label: 'Earthquake',   color: '#f59e0b' },
  FLOOD:        { emoji: '🌊', label: 'Flood',        color: '#3b82f6' },
  WILDFIRE:     { emoji: '🔥', label: 'Wildfire',     color: '#ef4444' },
  SEVERE_STORM: { emoji: '🌪️', label: 'Severe Storm', color: '#8b5cf6' },
  VOLCANO:      { emoji: '🌋', label: 'Volcano',      color: '#f97316' },
  LANDSLIDE:    { emoji: '⛰️', label: 'Landslide',    color: '#84cc16' },
};

export function LiveDisastersPage({ liveData }) {
  const { riskData, reports } = liveData;
  const [scope, setScope] = useState('global');
  const { events, loading, error, sourceErrors, fetchedAt, refresh } = useDisasters(scope);

  const criticalCount = events.filter(e => e.severity === 'CRITICAL').length;
  const highCount     = events.filter(e => e.severity === 'HIGH').length;
  const typeCounts    = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  const allFeedsFailed  = sourceErrors.length === 2;
  const someFeedsFailed = sourceErrors.length > 0 && !allFeedsFailed;

  return (
    <div className="tg-disasters-page" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 88px)' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>🌋 Live Disasters</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Real-time events from USGS &amp; NASA EONET · refreshes every 10 min
          </p>
        </div>

        {/* Scope toggle */}
        <div style={{ display: 'flex', gap: 0, background: '#111827', borderRadius: 8, padding: 3 }}>
          {['global', 'india'].map(s => (
            <button key={s} onClick={() => setScope(s)} style={{
              background: scope === s ? '#3b82f6' : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 18px',
              color: scope === s ? '#fff' : '#94a3b8',
              fontSize: 13, fontWeight: scope === s ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {s === 'global' ? '🌐 Global' : '🇮🇳 India'}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {fetchedAt && (
            <span style={{ fontSize: 11, color: '#475569' }}>
              Updated {fetchedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={refresh} disabled={loading} style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
            padding: '5px 12px', color: '#94a3b8', fontSize: 12, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Feed error banners */}
      {allFeedsFailed && !loading && (
        <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 12, flexShrink: 0 }}>
          ⚠️ Unable to reach external feeds (USGS &amp; NASA EONET). Check network connectivity and try refreshing.
        </div>
      )}
      {someFeedsFailed && !loading && (
        <div style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid #ea580c', borderRadius: 8, padding: '8px 14px', color: '#fdba74', fontSize: 11, flexShrink: 0 }}>
          ⚠️ Partial data: {sourceErrors.map(e => e.source).join(', ')} feed unavailable.
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid #dc2626', borderRadius: 8, padding: '8px 14px', color: '#fca5a5', fontSize: 11, flexShrink: 0 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI row — 5 cols desktop, 2 cols mobile */}
      <div className="tg-disaster-kpi-grid">
        <DisasterKPI label="Total Events"  value={loading ? '…' : events.length}                                      icon="📡" color="#3b82f6" />
        <DisasterKPI label="Critical"      value={loading ? '…' : criticalCount}                                       icon="🔴" color="#dc2626" alert={criticalCount > 0} />
        <DisasterKPI label="High Severity" value={loading ? '…' : highCount}                                           icon="🟠" color="#ea580c" />
        <DisasterKPI label="Earthquakes"   value={loading ? '…' : (typeCounts.EARTHQUAKE ?? 0)}                        icon="🌍" color="#f59e0b" />
        <DisasterKPI label="Other Events"  value={loading ? '…' : events.filter(e => e.type !== 'EARTHQUAKE').length}  icon="🌋" color="#8b5cf6" />
      </div>

      {/* Main grid: map + side panel */}
      <div className="tg-disasters-grid">

        {/* Map */}
        <div className="tg-map-wrap" style={{ position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, gap: 10, color: '#94a3b8', fontSize: 14, borderRadius: 8,
            }}>
              <span className="animate-spin" style={{ fontSize: 22, display: 'inline-block' }}>⟳</span>
              Loading live events…
            </div>
          )}
          <RiskMap
            mapMode="disasters"
            riskData={riskData}
            reports={reports}
            disasterEvents={events}
            disasterScope={scope}
          />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', minHeight: 0 }}>

          {/* Type legend */}
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px', border: '1px solid #334155', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', marginBottom: 8 }}>EVENT TYPES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(DISASTER_TYPE_META).map(([type, meta]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{meta.emoji} {meta.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: typeCounts[type] ? '#f1f5f9' : '#374151' }}>
                    {typeCounts[type] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Severity legend */}
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px', border: '1px solid #334155', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', marginBottom: 8 }}>SEVERITY</div>
            {[
              { level: 'CRITICAL', color: '#dc2626', count: criticalCount },
              { level: 'HIGH',     color: '#ea580c', count: highCount },
              { level: 'MODERATE', color: '#d97706', count: events.filter(e => e.severity === 'MODERATE').length },
              { level: 'LOW',      color: '#65a30d', count: events.filter(e => e.severity === 'LOW').length },
            ].map(({ level, color, count }) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ flex: 1, fontSize: 11, color: '#94a3b8' }}>{level}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: count ? '#f1f5f9' : '#374151' }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', flexShrink: 0 }}>
            RECENT EVENTS — CLICK MARKER TO INSPECT
          </div>

          {!loading && events.length === 0 && (
            <div style={{ background: '#1e293b', borderRadius: 8, padding: '20px 12px', border: '1px solid #334155', textAlign: 'center', color: '#475569', fontSize: 12 }}>
              {allFeedsFailed
                ? 'No data available — feeds offline'
                : `No disasters detected for ${scope === 'india' ? 'India' : 'the world'} right now`}
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto' }}>
            {events.slice(0, 40).map(ev => <DisasterEventCard key={ev.id} ev={ev} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisasterKPI({ label, value, icon, color, alert }) {
  return (
    <div style={{
      background: '#1e293b', border: `1px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: 8, padding: '10px 12px',
      ...(alert ? { animation: 'blink 2s infinite' } : {}),
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</div>
        </div>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
    </div>
  );
}

function DisasterEventCard({ ev }) {
  const meta         = DISASTER_TYPE_META[ev.type] ?? { emoji: '⚠️', label: ev.type, color: '#6b7280' };
  const severityColor = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#d97706', LOW: '#65a30d' }[ev.severity] ?? '#6b7280';
  const dateStr = ev.date
    ? new Date(ev.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div className="slide-in" style={{
      background: '#1e293b', borderRadius: 7, padding: '8px 10px',
      border: `1px solid ${severityColor}30`,
      borderLeft: `3px solid ${severityColor}`,
      marginBottom: 5, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 14 }}>{meta.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9', flex: 1, lineHeight: 1.3 }} title={ev.title}>
          {ev.title.length > 52 ? ev.title.slice(0, 50) + '…' : ev.title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ background: `${severityColor}20`, color: severityColor, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{ev.severity}</span>
        <span style={{ fontSize: 9, color: '#64748b' }}>{ev.source}</span>
        {ev.magnitude != null && <span style={{ fontSize: 9, color: '#fbbf24' }}>M{ev.magnitude.toFixed(1)}</span>}
        {dateStr && <span style={{ fontSize: 9, color: '#475569', marginLeft: 'auto' }}>{dateStr}</span>}
      </div>
      {ev.link && (
        <a href={ev.link} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: '#60a5fa', display: 'block', marginTop: 3 }}>
          View source ↗
        </a>
      )}
    </div>
  );
}
