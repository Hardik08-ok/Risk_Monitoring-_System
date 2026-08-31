import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, Legend,
} from 'recharts';
import { fetchHistory, calculateRisk } from '../utils/api';
import { getRiskColor } from '../utils/helpers';

export default function AnalyticsPage({ liveData }) {
  const { riskData, sensors } = liveData;
  const [history, setHistory]   = useState([]);
  const [selectedId, setSelectedId] = useState('R001');
  const [calcParams, setCalcParams] = useState({ rainfall: 85, soilMoisture: 78, slopeGradient: 38, historicalIndex: 72, fieldReportCount: 5 });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    fetchHistory(selectedId, 24).then(setHistory).catch(() => {});
  }, [selectedId]);

  async function runCalculation() {
    setCalcLoading(true);
    const result = await calculateRisk(calcParams).catch(() => null);
    setCalcResult(result);
    setCalcLoading(false);
  }

  const scoreDistribution = [
    { range: '0-25', label: 'Minimal', count: riskData.filter(r => r.score <= 25).length, color: '#16a34a' },
    { range: '26-45', label: 'Low', count: riskData.filter(r => r.score > 25 && r.score <= 45).length, color: '#65a30d' },
    { range: '46-65', label: 'Moderate', count: riskData.filter(r => r.score > 45 && r.score <= 65).length, color: '#d97706' },
    { range: '66-80', label: 'High', count: riskData.filter(r => r.score > 65 && r.score <= 80).length, color: '#ea580c' },
    { range: '81-100', label: 'Critical', count: riskData.filter(r => r.score > 80).length, color: '#dc2626' },
  ];

  const radarData = riskData.slice(0, 6).map(r => ({
    region: r.region.split(',')[0],
    score: r.score,
    rainfall: Math.round(r.sensor?.rainfall_mmph || 0),
    soil: Math.round(r.sensor?.soil_moisture_pct || 0),
  }));

  const tt = { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }, labelStyle: { color: '#94a3b8' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📊 Analytics</h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Risk distribution, trends, and the AI risk calculator</p>
      </div>

      {/* Row 1: score dist + comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ChartCard title="Risk Score Distribution — All Regions">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <Tooltip {...tt} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Regional Risk Comparison">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskData.slice(0,8).map(r => ({ name: r.region.split(',')[0], score: r.score, color: r.color }))} layout="vertical" margin={{ top: 4, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip {...tt} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {riskData.slice(0,8).map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Time trend */}
      <ChartCard title={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>24h Sensor Trend</span>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{
            background: '#334155', border: '1px solid #475569', borderRadius: 4, padding: '2px 6px', color: '#94a3b8', fontSize: 11,
          }}>
            {riskData.map(r => <option key={r.regionId} value={r.regionId}>{r.region}</option>)}
          </select>
        </div>
      }>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={history} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} interval={5} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
            <Tooltip {...tt} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Line type="monotone" dataKey="riskScore" stroke="#dc2626" strokeWidth={2} dot={false} name="Risk Score" />
            <Line type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Rainfall mm/h" />
            <Line type="monotone" dataKey="soilMoisture" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Soil Moisture %" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 3: AI Calculator + Comparison Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* AI Risk Calculator */}
        <ChartCard title="🧮 AI Risk Calculator (Predictive Engine v2.0)">
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {Object.entries(calcParams).map(([key, val]) => {
                const labels = { rainfall: 'Rainfall (mm/h)', soilMoisture: 'Soil Moisture (%)', slopeGradient: 'Slope (°)', historicalIndex: 'Historical Index', fieldReportCount: 'Field Reports' };
                const maxes  = { rainfall: 150, soilMoisture: 100, slopeGradient: 60, historicalIndex: 100, fieldReportCount: 20 };
                return (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                      <span>{labels[key]}</span><span style={{ color: '#60a5fa', fontWeight: 700 }}>{val}</span>
                    </div>
                    <input type="range" min={0} max={maxes[key]} value={val}
                      onChange={e => setCalcParams(prev => ({ ...prev, [key]: +e.target.value }))}
                      style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                  </div>
                );
              })}
              <button onClick={runCalculation} disabled={calcLoading} style={{
                width: '100%', background: '#1d4ed8', border: 'none', borderRadius: 6,
                padding: '8px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4,
              }}>
                {calcLoading ? '⟳ Computing…' : '🧠 Calculate Risk'}
              </button>
            </div>

            {calcResult && (
              <div style={{ width: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Risk Score</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: getRiskColor(calcResult.level), lineHeight: 1 }}>{calcResult.score}</div>
                <div style={{
                  background: `${getRiskColor(calcResult.level)}25`, color: getRiskColor(calcResult.level),
                  border: `1px solid ${getRiskColor(calcResult.level)}60`, borderRadius: 5,
                  padding: '3px 10px', fontSize: 11, fontWeight: 700,
                }}>{calcResult.level}</div>
                <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                  Alert: {calcResult.alertStatus}
                </div>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Comparison Matrix */}
        <ChartCard title="📋 Paradigm Comparison Matrix">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Dimension', 'Traditional', 'TerraGuard AI'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: 10, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Monitoring',      'Reactive / Manual',   'Predictive / AI-Driven'],
                ['Data Integration','Fragmented Silos',    'Integrated GIS Base'],
                ['Field Reporting', 'Verbal / Delayed',    'Geo-Tagged Offline App'],
                ['Actionability',   'Delayed Response',    'Alert-Driven Priority'],
                ['Coverage',        'Urban Only',          'All NER Terrain'],
                ['Update Freq.',    'Hours / Days',        'Real-time (15s)'],
              ].map(([dim, old, nw]) => (
                <tr key={dim} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 8px', color: '#94a3b8', fontWeight: 500 }}>{dim}</td>
                  <td style={{ padding: '6px 8px', color: '#ef4444' }}>{old}</td>
                  <td style={{ padding: '6px 8px', color: '#22c55e', fontWeight: 500 }}>{nw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>

      {/* Technical References */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 16px' }}>
        <div style={{ fontSize: 10, color: '#3b82f6', fontFamily: 'monospace' }}>
          [SYS_REF]: NASA GPM IMERG Precipitation Data | ISRO Bhuvan LISS-IV | TensorFlow AI Framework | PostGIS Spatial Database | OpenStreetMap | React + Node.js
        </div>
        <div style={{ fontSize: 10, color: '#334155', marginTop: 4, fontFamily: 'monospace' }}>
          TEAM: TerraGuard AI | MDN-8492 | A. Sharma, R. Verma, S. Das, K. Singh | CLIENT: MDoNER
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
