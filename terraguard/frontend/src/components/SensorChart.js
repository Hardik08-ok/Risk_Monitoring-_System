import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { fetchHistory } from '../utils/api';
import { getRiskColor } from '../utils/helpers';

export default function SensorChart({ regionId, regionName, level }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!regionId) return;
    setLoading(true);
    fetchHistory(regionId, 24)
      .then(d => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [regionId]);

  const color = getRiskColor(level);

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12 }}>Loading chart…</div>;

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 },
    labelStyle: { color: '#94a3b8' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>24h Trend — {regionName}</div>

      {/* Risk Score trend */}
      <div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Risk Score</div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={history} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} interval={5} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="riskScore" stroke={color} fill="url(#riskGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rainfall bars */}
      <div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Rainfall (mm/h)</div>
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={history} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} interval={5} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="rainfall" radius={[2, 2, 0, 0]}>
              {history.map((entry, i) => (
                <Cell key={i} fill={entry.rainfall > 80 ? '#dc2626' : entry.rainfall > 40 ? '#ea580c' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
