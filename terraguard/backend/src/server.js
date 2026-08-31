const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/risk', require('./routes/risk'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/regions', require('./routes/regions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'TerraGuard AI Online', version: '2.0', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🛡️  TerraGuard AI Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
