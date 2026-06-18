/**
 * USGS Real-Time Stream Gauge Route
 * Fetches live gage height data for DFW-area waterways.
 * Uses the USGS Water Data OGC API (api.waterdata.usgs.gov).
 *
 * Parameter code 00065 = gage height in feet.
 * Flood stage thresholds sourced from NWS Advanced Hydrologic Prediction Service.
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

const USGS_BASE = 'https://api.waterdata.usgs.gov/ogcapi/v0/collections/daily/items';

/**
 * DFW stream gauge sites with NWS flood stage thresholds (feet).
 * Site numbers from USGS NWIS for Collin, Dallas, Denton, Tarrant counties.
 */
const DFW_GAUGES = {
  // Trinity River at Dallas (Dallas County)
  'USGS-08057000': {
    name: 'Trinity River at Dallas',
    waterway: 'Trinity River',
    locations: ['downtown_dallas', 'irving'],
    floodStage: 20.0,   // NWS action stage
    majorFloodStage: 28.0,
  },
  // Elm Fork Trinity River at Carrollton (Dallas/Denton County)
  'USGS-08055000': {
    name: 'Elm Fork Trinity River at Carrollton',
    waterway: 'Elm Fork Trinity River',
    locations: ['downtown_dallas', 'irving', 'denton'],
    floodStage: 18.0,
    majorFloodStage: 24.0,
  },
  // East Fork Trinity River at Wylie (Collin County — covers Frisco/Plano/McKinney)
  'USGS-08057410': {
    name: 'East Fork Trinity River at Wylie',
    waterway: 'East Fork Trinity River',
    locations: ['frisco', 'plano', 'mckinney', 'garland'],
    floodStage: 15.0,
    majorFloodStage: 21.0,
  },
  // West Fork Trinity River at Fort Worth (Tarrant County)
  'USGS-08048000': {
    name: 'West Fork Trinity River at Fort Worth',
    waterway: 'West Fork Trinity River',
    locations: ['fort_worth', 'arlington'],
    floodStage: 22.0,
    majorFloodStage: 30.0,
  },
  // Denton Creek near Grapevine (Denton County)
  'USGS-08048550': {
    name: 'Denton Creek near Grapevine',
    waterway: 'Denton Creek',
    locations: ['denton', 'fort_worth'],
    floodStage: 16.0,
    majorFloodStage: 22.0,
  },
};

/**
 * Fetch latest daily gage height for a single site.
 * Returns null on failure so callers can handle gracefully.
 */
async function fetchGaugeReading(siteId) {
  try {
    // Get the most recent daily mean gage height (statistic 00003, parameter 00065)
    const today = new Date();
    const threeDaysAgo = new Date(today - 3 * 24 * 60 * 60 * 1000);
    const dateStr = threeDaysAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const response = await axios.get(USGS_BASE, {
      params: {
        f: 'json',
        monitoring_location_id: siteId,
        parameter_code: '00065',
        statistic_id: '00003',
        datetime: `${dateStr}/${todayStr}`,
        limit: 1,
      },
      timeout: 10000,
      headers: { 'Accept': 'application/json' },
    });

    const features = response.data.features;
    if (!features || features.length === 0) return null;

    const latest = features[features.length - 1];
    return {
      siteId,
      value: parseFloat(latest.properties.value),
      unit: latest.properties.unit_of_measure,
      time: latest.properties.time,
      approvalStatus: latest.properties.approvals_status,
    };
  } catch (err) {
    console.warn(`USGS gauge fetch failed for ${siteId}:`, err.message);
    return null;
  }
}

/**
 * Classify flood severity based on gage height vs thresholds.
 */
function classifyFloodLevel(gageHeight, gauge) {
  if (gageHeight >= gauge.majorFloodStage) return 'major';
  if (gageHeight >= gauge.floodStage)      return 'minor';
  if (gageHeight >= gauge.floodStage * 0.8) return 'near_flood_stage';
  return 'normal';
}

/**
 * GET /api/usgs/flood/location/:locationId
 * Returns flood status for gauges relevant to a DFW location key (e.g. "frisco").
 */
router.get('/flood/location/:locationId', async (req, res) => {
  const locationId = req.params.locationId.toLowerCase().replace(/\s+/g, '_');

  const relevantGauges = Object.entries(DFW_GAUGES).filter(([, meta]) =>
    meta.locations.includes(locationId)
  );

  if (relevantGauges.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No USGS gauges found for this location',
    });
  }

  const readings = await Promise.all(
    relevantGauges.map(async ([siteId, meta]) => {
      const reading = await fetchGaugeReading(siteId);
      if (!reading) return { siteId, name: meta.name, waterway: meta.waterway, status: 'unavailable' };

      const level = classifyFloodLevel(reading.value, meta);
      return {
        siteId,
        name: meta.name,
        waterway: meta.waterway,
        gageHeight: reading.value,
        unit: reading.unit,
        time: reading.time,
        floodStage: meta.floodStage,
        majorFloodStage: meta.majorFloodStage,
        floodLevel: level,
        isFlooding: level === 'minor' || level === 'major',
        sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${siteId.replace('USGS-', '')}`,
      };
    })
  );

  const activeFlooding = readings.filter(r => r.isFlooding);
  const nearFloodStage = readings.filter(r => r.floodLevel === 'near_flood_stage');

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    location: locationId,
    summary: {
      gaugesChecked: readings.length,
      activeFlooding: activeFlooding.length,
      nearFloodStage: nearFloodStage.length,
      floodingDetected: activeFlooding.length > 0,
    },
    gauges: readings,
    sources: readings
      .filter(r => r.sourceUrl)
      .map(r => r.sourceUrl),
  });
});

/**
 * GET /api/usgs/flood/all
 * Returns status for all monitored DFW gauges.
 */
router.get('/flood/all', async (req, res) => {
  const readings = await Promise.all(
    Object.entries(DFW_GAUGES).map(async ([siteId, meta]) => {
      const reading = await fetchGaugeReading(siteId);
      if (!reading) return { siteId, name: meta.name, status: 'unavailable' };

      const level = classifyFloodLevel(reading.value, meta);
      return {
        siteId,
        name: meta.name,
        waterway: meta.waterway,
        affectsLocations: meta.locations,
        gageHeight: reading.value,
        unit: reading.unit,
        time: reading.time,
        floodLevel: level,
        isFlooding: level === 'minor' || level === 'major',
      };
    })
  );

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    activeFlooding: readings.filter(r => r.isFlooding).length,
    gauges: readings,
  });
});

export default router;
export { DFW_GAUGES, fetchGaugeReading, classifyFloodLevel };
