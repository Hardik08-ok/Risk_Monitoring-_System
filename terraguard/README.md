# 🛡️ TerraGuard AI
## AI-Based Early Warning and Landslide Risk Monitoring System — North Eastern India

**Team ID:** MDN-8492 | **Team Name:** TerraGuard AI  
**Client:** MDoNER (Ministry of Development of North Eastern Region)  
**Category:** Disaster Management & AI  
**Members:** A. Sharma, R. Verma, S. Das, K. Singh

---

## 🚀 Quick Start

### Project layout

```
terraguard/
├── frontend/                 # React dashboard and interactive map
│   ├── public/               # Static HTML assets
│   ├── src/
│   │   ├── components/       # Reusable UI and map/chart components
│   │   ├── hooks/            # React data hooks
│   │   ├── pages/            # Dashboard, alerts, analytics, reports
│   │   └── utils/            # API client and helpers
│   └── .env.example          # Frontend configuration template
├── backend/                  # Express API and risk-engine logic
│   ├── src/
│   │   ├── data/             # Region seed data
│   │   ├── routes/           # API route handlers
│   │   ├── riskEngine.js     # Risk-score calculation
│   │   └── server.js         # API entry point
│   └── .env.example          # Backend configuration template
├── .gitignore                # Files excluded from GitHub
├── package.json              # Root convenience commands
└── verify.js                 # Project verification script
```

### From the project root

```bash
npm run install:all
npm run start:backend     # terminal 1
npm run start:frontend    # terminal 2
```

### 1. Backend (Node.js + Express)
```bash
cd backend
npm install
npm start        # Production
npm run dev      # Development (nodemon)
# → Running on http://localhost:5000
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm start
# → Running on http://localhost:3000
```

---

## 🏗️ System Architecture

```
Data Sources → Processing → AI/ML Engine → Risk Score → GIS Map → Early Warning → Action
  (IoT/APIs)   (Normalize)  (Risk Calc v2)  (0-100)     (Leaflet)  (SMS/Dashboard) (Evacuate)
```

### Layers
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Leaflet (GIS), Recharts |
| **Backend** | Node.js, Express 4 |
| **Risk Engine** | Multi-variate weighted algorithm |
| **GIS** | Leaflet + OpenStreetMap dark tiles |
| **Offline Sync** | localStorage + batch sync API |
| **Data Sources** | IoT sensor simulation (production: NASA GPM IMERG, ISRO Bhuvan) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/risk/all` | Risk scores for all 8 NER regions |
| GET | `/api/risk/:regionId` | Detailed risk breakdown |
| POST | `/api/risk/calculate` | Custom risk calculation |
| GET | `/api/alerts` | Active alerts with dispatch info |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/dispatch` | Trigger action dispatch |
| GET | `/api/sensors` | All sensor readings |
| GET | `/api/sensors/:id/history` | 24h time series |
| GET | `/api/reports` | Field reports |
| POST | `/api/reports` | Submit geo-tagged report |
| POST | `/api/reports/sync` | Batch sync offline reports |
| GET | `/api/regions` | Region metadata |

---

## 🧠 Risk Engine (v2.0)

**Formula:**
```
Risk Score = (Rainfall × 0.30) + (Soil Moisture × 0.25) + 
             (Slope Gradient × 0.20) + (Historical Index × 0.15) + 
             (Field Reports × 0.10)
```

**Thresholds:**
- `≥ 80` → CRITICAL — Immediate evacuation
- `65–79` → HIGH — Road closures, emergency standby  
- `45–64` → MODERATE — Enhanced monitoring
- `25–44` → LOW — Normal operations
- `< 25` → MINIMAL

---

## 📱 Features

### Live Dashboard
- Interactive dark-mode Leaflet map of NER with pulsing risk markers
- Color-coded zones: Critical (red) → Minimal (green)
- Click any region → drill into risk components + sensor charts
- Real-time auto-refresh every 15 seconds
- Command pipeline status bar

### Alert Center
- Alert escalation funnel visualization
- One-click acknowledge + dispatch
- Filter by level: ALL / CRITICAL / HIGH / MODERATE
- Dispatch log with authority targeting

### Field Reporter
- Geo-tagged incident submission (7 incident types)
- **Offline-First Protocol**: saves to localStorage when disconnected
- Batch sync on reconnect via `/api/reports/sync`
- Real-time GPS location button

### Analytics
- Risk score distribution chart
- Regional comparison (horizontal bars)
- 24h sensor trend lines per region
- **Interactive AI Risk Calculator** with live sliders
- Traditional vs TerraGuard AI comparison matrix

---

## 🌍 Monitored Regions

| Region | State | Slope | Vulnerability |
|--------|-------|-------|---------------|
| Gangtok | Sikkim | 42° | HIGH |
| Imphal | Manipur | 28° | MODERATE |
| Shillong | Meghalaya | 35° | HIGH |
| Kohima | Nagaland | 38° | HIGH |
| Itanagar | Arunachal Pradesh | 45° | CRITICAL |
| Aizawl | Mizoram | 40° | HIGH |
| Agartala | Tripura | 22° | MODERATE |
| Guwahati | Assam | 18° | MODERATE |

---

## 🔭 Future Scope
- NASA GPM IMERG live precipitation data integration
- ISRO Bhuvan LISS-IV satellite imagery analysis
- Regional IoT sensor network deployment
- Multilingual SMS alerts (Assamese, Bengali, Meitei, etc.)
- Mobile app (React Native) with offline-first architecture
- PostGIS spatial database for historical analysis

---

## 📚 Technical References
`[SYS_REF]` NASA GPM IMERG | ISRO Bhuvan LISS-IV | TensorFlow | PostGIS | OpenStreetMap | React | Node.js
