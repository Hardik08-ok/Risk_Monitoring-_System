import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRiskAll, fetchAlerts, fetchReports, fetchSensors } from '../utils/api';

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
