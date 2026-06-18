/**
 * USAII Emergency Monitoring Backend Server
 * Multi-source data aggregation for DFW emergency tracking
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nwsRoutes from './routes/nws.js';
import mockRoutes from './routes/mock.js';
import verifyRoutes from './routes/verify.js';
import usgsRoutes from './routes/usgs.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/nws', nwsRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/usgs', usgsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      nws: 'operational',
      mock_pd: 'operational',
      mock_ercot: 'operational'
    }
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'USAII Emergency Monitor API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      nws_alerts: '/api/nws/alerts/active',
      nws_location: '/api/nws/alerts/location/:locationName',
      nws_point: '/api/nws/alerts/point/:lat/:lon',
      nws_forecast: '/api/nws/forecast/:locationName',
      pd_incidents: '/api/mock/pd/incidents',
      pd_location: '/api/mock/pd/location/:locationName',
      ercot_status: '/api/mock/ercot/status',
      ercot_outages: '/api/mock/ercot/outages',
      ercot_location: '/api/mock/ercot/location/:locationName',
      comprehensive: '/api/mock/comprehensive/:locationName'
    },
    supported_locations: [
      'Frisco', 'Plano', 'Downtown Dallas', 'Arlington', 
      'Fort Worth', 'Irving', 'McKinney', 'Denton', 
      'Garland', 'Mesquite'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚨 USAII Emergency Monitor Server Running`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/`);
  console.log(`\nActive Data Sources:`);
  console.log(`  ✅ NWS Live Alerts (api.weather.gov)`);
  console.log(`  ✅ Mock PD Incident Logs`);
  console.log(`  ✅ Mock ERCOT Grid Status\n`);
});
