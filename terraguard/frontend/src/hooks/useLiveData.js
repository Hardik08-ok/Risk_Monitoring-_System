import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRiskAll, fetchAlerts, fetchReports, fetchSensors, fetchDisasters } from '../utils/api';

export function useLiveData(intervalMs = 15000) {
  const [riskData, setRiskData]     = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [reports, setReports]       = useState([]);
  const [sensors, setSensors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError]           = useState(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [risk, alrt, rpts, sens] = await Promise.all([
        fetchRiskAll(), fetchAlerts(), fetchReports(), fetchSensors(),
      ]);
      if (!mountedRef.current) return;
      setRiskData(risk);
      setAlerts(alrt);
      setReports(rpts);
      setSensors(sens);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [refresh, intervalMs]);

  const criticalCount = alerts.filter(a => a.level === 'CRITICAL').length;
  const highCount     = alerts.filter(a => a.level === 'HIGH').length;

  return { riskData, alerts, reports, sensors, loading, lastUpdate, error, refresh, criticalCount, highCount };
}

// ── useDisasters ──────────────────────────────────────────────────────────────
// Polls /api/disasters every 10 minutes for live global / India event data.
// scope: 'global' | 'india'
const DISASTERS_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

export function useDisasters(scope = 'global') {
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [sourceErrors, setSourceErrors] = useState([]);
  const [fetchedAt,    setFetchedAt]    = useState(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDisasters(scope);
      if (!mountedRef.current) return;
      setEvents(res.data ?? []);
      setSourceErrors(res.sourceErrors ?? []);
      setFetchedAt(res.fetchedAt ? new Date(res.fetchedAt) : new Date());
    } catch (e) {
      if (mountedRef.current) {
        setError(e.message ?? 'Failed to load disaster data');
        setLoading(false);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const id = setInterval(refresh, DISASTERS_REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [refresh]);

  return { events, loading, error, sourceErrors, fetchedAt, scope, refresh };
}
