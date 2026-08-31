import React, { useState } from 'react';
import RiskMap from '../components/RiskMap';
import RiskCard from '../components/RiskCard';
import PipelineStatus from '../components/PipelineStatus';
import SensorChart from '../components/SensorChart';
import RiskFactorChart from '../components/RiskFactorChart';
import { fetchRisk } from '../utils/api';

export default function Dashboard({ liveData }) {
  const { riskData, alerts, reports, loading } = liveData;
  const [selectedRegion, setSelectedRegion]    = useState(null);
  const [regionDetail, setRegionDetail]        = useState(null);

  const criticalCount  = riskData.filter(r => r.level === 'CRITICAL').length;
  const highCount      = riskData.filter(r => r.level === 'HIGH').length;
  const avgScore       = riskData.length ? Math.round(riskData.reduce((s, r) => s + r.score, 0) / riskData.length) : 0;
  const maxScore       = riskData.length ? Math.max(...riskData.map(r => r.score)) : 0;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 88px)' }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, flexShrink: 0 }}>
        <KPI label="Regions Monitored" value={riskData.length} icon="🗺️" color="#3b82f6" />
        <KPI label="Critical Zones" value={criticalCount} icon="🔴" color="#dc2626" alert />
        <KPI label="High Risk Zones" value={highCount} icon="🟠" color="#ea580c" />
        <KPI label="Avg Risk Score" value={avgScore} icon="📊" color="#d97706" />
        <KPI label="Active Alerts" value={alerts.filter(a => !a.acknowledged).length} icon="🚨" color="#ea580c" />
      </div>

      {/* Pipeline */}
      <PipelineStatus riskData={riskData} />

      {/* Main grid: Map + side panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12, minHeight: 0 }}>

        {/* Map */}
        <div style={{ background: '#1e293b', borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
          <RiskMap riskData={riskData} reports={reports} onRegionClick={handleRegionSelect} />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>

          {/* Selected region detail */}
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

          {/* Risk cards */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
            ALL REGIONS — CLICK TO INSPECT
          </div>
          {[...riskData]
            .sort((a, b) => b.score - a.score)
            .map(r => (
              <RiskCard
                key={r.regionId}
                {...r}
                onClick={() => handleRegionSelect(r)}
              />
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
