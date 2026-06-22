import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nwsRoutes from './routes/nws.js';
import mockRoutes from './routes/mock.js';
import verifyRoutes from './routes/verify.js';
import usgsRoutes from './routes/usgs.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/nws', nwsRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/usgs', usgsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'VerifyDFW API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      verify: '/api/verify',
      nws_alerts: '/api/nws/alerts/active',
      nws_location: '/api/nws/alerts/location/:locationName',
      pd_incidents: '/api/mock/pd/incidents',
      ercot_status: '/api/mock/ercot/status',
    },
    supported_locations: [
      'Frisco', 'Plano', 'Downtown Dallas', 'Arlington',
      'Fort Worth', 'Irving', 'McKinney', 'Denton',
      'Garland', 'Mesquite'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`VerifyDFW backend running on port ${PORT}`);
});
