import express from 'express';
import { DFW_LOCATIONS, findLocationByText } from '../config/dfwCoordinates.js';

const router = express.Router();

/**
 * Mock Police Department Incident Data
 */
const MOCK_PD_INCIDENTS = [
  {
    id: "PD-2026-001234",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    location: "frisco",
    incident_type: "weather_emergency",
    severity: "high",
    description: "Multiple reports of tornado sighting near Preston Road and Warren Parkway",
    status: "active",
    units_dispatched: 6,
    verified: true
  },
  {
    id: "PD-2026-001235",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    location: "plano",
    incident_type: "flooding",
    severity: "medium",
    description: "Street flooding reported on Legacy Drive near Central Expressway",
    status: "investigating",
    units_dispatched: 3,
    verified: false
  },
  {
    id: "PD-2026-001236",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    location: "downtown_dallas",
    incident_type: "power_outage",
    severity: "medium",
    description: "Traffic signals out in downtown area, multiple intersections affected",
    status: "active",
    units_dispatched: 4,
    verified: true
  },
  {
    id: "PD-2026-001237",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    location: "arlington",
    incident_type: "severe_weather",
    severity: "high",
    description: "Large hail and high winds reported near AT&T Stadium",
    status: "active",
    units_dispatched: 5,
    verified: true
  }
];

/**
 * Mock ERCOT Power Grid Status
 */
const MOCK_ERCOT_STATUS = {
  grid_status: "normal",
  current_demand_mw: 52340,
  available_capacity_mw: 68500,
  reserve_margin_percent: 23.6,
  last_updated: new Date().toISOString(),
  regional_outages: [
    {
      region: "North Central",
      affected_areas: ["Downtown Dallas", "Irving"],
      customers_affected: 3450,
      estimated_restoration: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      cause: "severe_weather",
      status: "crews_dispatched"
    },
    {
      region: "North",
      affected_areas: ["Frisco", "McKinney"],
      customers_affected: 1200,
      estimated_restoration: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      cause: "equipment_failure",
      status: "under_repair"
    }
  ],
  alerts: [
    {
      level: "advisory",
      message: "Increased demand expected due to severe weather conditions",
      issued_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    }
  ]
};

/**
 * GET /api/mock/pd/incidents
 * Get all mock police department incidents
 */
router.get('/pd/incidents', (req, res) => {
  const { location, severity, status } = req.query;
  
  let filteredIncidents = [...MOCK_PD_INCIDENTS];
  
  if (location) {
    const foundLocation = findLocationByText(location);
    if (foundLocation) {
      filteredIncidents = filteredIncidents.filter(
        incident => incident.location === foundLocation.id
      );
    }
  }
  
  if (severity) {
    filteredIncidents = filteredIncidents.filter(
      incident => incident.severity === severity
    );
  }
  
  if (status) {
    filteredIncidents = filteredIncidents.filter(
      incident => incident.status === status
    );
  }
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_incidents: filteredIncidents.length,
    incidents: filteredIncidents.map(incident => ({
      ...incident,
      location_details: DFW_LOCATIONS[incident.location]
    }))
  });
});

/**
 * GET /api/mock/pd/incidents/:id
 * Get specific incident by ID
 */
router.get('/pd/incidents/:id', (req, res) => {
  const incident = MOCK_PD_INCIDENTS.find(inc => inc.id === req.params.id);
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      error: 'Incident not found'
    });
  }
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    incident: {
      ...incident,
      location_details: DFW_LOCATIONS[incident.location]
    }
  });
});

/**
 * GET /api/mock/pd/location/:locationName
 * Get incidents for a specific location
 */
router.get('/pd/location/:locationName', (req, res) => {
  const location = findLocationByText(req.params.locationName);
  
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }
  
  const locationIncidents = MOCK_PD_INCIDENTS.filter(
    incident => incident.location === location.id
  );
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    location: {
      name: location.name,
      county: location.county
    },
    incident_count: locationIncidents.length,
    incidents: locationIncidents
  });
});

/**
 * GET /api/mock/ercot/status
 * Get current ERCOT grid status
 */
router.get('/ercot/status', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...MOCK_ERCOT_STATUS
  });
});

/**
 * GET /api/mock/ercot/outages
 * Get current power outages
 */
router.get('/ercot/outages', (req, res) => {
  const { location } = req.query;
  
  let outages = MOCK_ERCOT_STATUS.regional_outages;
  
  if (location) {
    const foundLocation = findLocationByText(location);
    if (foundLocation) {
      outages = outages.filter(outage =>
        outage.affected_areas.some(area => 
          area.toLowerCase().includes(foundLocation.name.toLowerCase())
        )
      );
    }
  }
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_outages: outages.length,
    total_customers_affected: outages.reduce(
      (sum, outage) => sum + outage.customers_affected, 0
    ),
    outages
  });
});

/**
 * GET /api/mock/ercot/location/:locationName
 * Get ERCOT status for specific location
 */
router.get('/ercot/location/:locationName', (req, res) => {
  const location = findLocationByText(req.params.locationName);
  
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }
  
  const relevantOutages = MOCK_ERCOT_STATUS.regional_outages.filter(outage =>
    outage.affected_areas.some(area =>
      area.toLowerCase().includes(location.name.toLowerCase())
    )
  );
  
  const hasOutage = relevantOutages.length > 0;
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    location: {
      name: location.name,
      county: location.county
    },
    power_status: hasOutage ? "outage" : "normal",
    outages: relevantOutages,
    grid_status: MOCK_ERCOT_STATUS.grid_status,
    current_demand_mw: MOCK_ERCOT_STATUS.current_demand_mw
  });
});

/**
 * GET /api/mock/comprehensive/:locationName
 * Get comprehensive multi-source data for a location
 */
router.get('/comprehensive/:locationName', async (req, res) => {
  const location = findLocationByText(req.params.locationName);
  
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }
  
  // Gather all data sources
  const pdIncidents = MOCK_PD_INCIDENTS.filter(
    incident => incident.location === location.id
  );
  
  const ercotOutages = MOCK_ERCOT_STATUS.regional_outages.filter(outage =>
    outage.affected_areas.some(area =>
      area.toLowerCase().includes(location.name.toLowerCase())
    )
  );
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    location: {
      id: location.id,
      name: location.name,
      county: location.county,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      nws_zone: location.nwsZoneId,
      population: location.population
    },
    summary: {
      active_pd_incidents: pdIncidents.filter(i => i.status === 'active').length,
      verified_incidents: pdIncidents.filter(i => i.verified).length,
      power_outages: ercotOutages.length,
      customers_affected: ercotOutages.reduce((sum, o) => sum + o.customers_affected, 0)
    },
    pd_incidents: pdIncidents,
    power_status: {
      has_outage: ercotOutages.length > 0,
      outages: ercotOutages,
      grid_status: MOCK_ERCOT_STATUS.grid_status
    }
  });
});

export default router;
