import React, { useState } from 'react';
import { useLiveData } from './hooks/useLiveData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { LiveDisastersPage } from './pages/Dashboard';
import AlertsPage from './pages/AlertsPage';
import FieldReporter from './pages/FieldReporter';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const liveData = useLiveData(15000);

  const pages = {
    dashboard: Dashboard,
    disasters: LiveDisastersPage,
    alerts: AlertsPage,
    reporter: FieldReporter,
    analytics: AnalyticsPage,
  };
  const CurrentPage = pages[page] || Dashboard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      <Header liveData={liveData} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activePage={page} setPage={setPage} liveData={liveData} />
        <main style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <CurrentPage liveData={liveData} />
        </main>
      </div>
    </div>
  );
}
