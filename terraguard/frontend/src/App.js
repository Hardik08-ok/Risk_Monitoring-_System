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
  const [page, setPage]           = useState('dashboard');
  const [sidebarOpen, setSidebar] = useState(false);
  const liveData = useLiveData(15000);

  const pages = {
    dashboard: Dashboard,
    disasters: LiveDisastersPage,
    alerts:    AlertsPage,
    reporter:  FieldReporter,
    analytics: AnalyticsPage,
  };
  const CurrentPage = pages[page] || Dashboard;

  function navigate(id) {
    setPage(id);
    setSidebar(false); // close drawer after navigation on mobile
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      <Header liveData={liveData} onMenuClick={() => setSidebar(o => !o)} />

      <div className="tg-app-body">
        {/* Backdrop — taps close the drawer on mobile */}
        {sidebarOpen && (
          <div className="tg-sidebar-backdrop" onClick={() => setSidebar(false)} />
        )}

        <Sidebar
          activePage={page}
          setPage={navigate}
          liveData={liveData}
          isOpen={sidebarOpen}
          onClose={() => setSidebar(false)}
        />

        <main style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <CurrentPage liveData={liveData} />
        </main>
      </div>
    </div>
  );
}
