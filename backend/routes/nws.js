import express from 'express';
import axios from 'axios';
import { DFW_LOCATIONS, TEXAS_NWS_ZONES, findLocationByText } from '../config/dfwCoordinates.js';

const router = express.Router();

// NWS API base URL
const NWS_BASE_URL = 'https://api.weather.gov';

// Custom headers required by NWS API
const NWS_HEADERS = {
  'User-Agent': '(USAII Emergency Monitor, contact@example.com)',
  'Accept': 'application/geo+json'
};

/**
 * GET /api/nws/alerts/active
 * Fetch all active alerts for Texas
 */
router.get('/alerts/active', async (req, res) => {
  try {
    const response = await axios.get(`${NWS_BASE_URL}/alerts/active`, {
      headers: NWS_HEADERS,
      params: {
        area: 'TX', // Texas alerts only
        status: 'actual'
      },
      timeout: 10000
    });

    const alerts = response.data.features || [];
    
    // Filter and map to DFW relevant zones
    const dfwAlerts = alerts.filter(alert => {
      const zones = alert.properties.geocode?.UGC || [];
      return zones.some(zone => Object.keys(TEXAS_NWS_ZONES).includes(zone));
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_alerts: alerts.length,
      dfw_alerts: dfwAlerts.length,
      alerts: dfwAlerts.map(alert => ({
        id: alert.id,
        event: alert.properties.event,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        certainty: alert.properties.certainty,
        headline: alert.properties.headline,
        description: alert.properties.description,
        instruction: alert.properties.instruction,
        onset: alert.properties.onset,
        expires: alert.properties.expires,
        affected_zones: alert.properties.geocode?.UGC || [],
        affected_areas: alert.properties.areaDesc,
        sent: alert.properties.sent
      }))
    });
  } catch (error) {
    console.error('NWS API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NWS alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/nws/alerts/location/:locationName
 * Fetch alerts for a specific DFW location
 */
router.get('/alerts/location/:locationName', async (req, res) => {
  try {
    const location = findLocationByText(req.params.locationName);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
        message: `Could not find location: ${req.params.locationName}`
      });
    }

    const response = await axios.get(`${NWS_BASE_URL}/alerts/active`, {
      headers: NWS_HEADERS,
      params: {
        zone: location.nwsZoneId
      },
      timeout: 10000
    });

    const alerts = response.data.features || [];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        name: location.name,
        county: location.county,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        nws_zone: location.nwsZoneId
      },
      alert_count: alerts.length,
      alerts: alerts.map(alert => ({
        id: alert.id,
        event: alert.properties.event,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        headline: alert.properties.headline,
        description: alert.properties.description,
        instruction: alert.properties.instruction,
        onset: alert.properties.onset,
        expires: alert.properties.expires
      }))
    });
  } catch (error) {
    console.error('NWS Location Alert Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/nws/alerts/point/:lat/:lon
 * Fetch alerts for specific coordinates
 */
router.get('/alerts/point/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const response = await axios.get(`${NWS_BASE_URL}/alerts/active`, {
      headers: NWS_HEADERS,
      params: {
        point: `${lat},${lon}`
      },
      timeout: 10000
    });

    const alerts = response.data.features || [];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      coordinates: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      },
      alert_count: alerts.length,
      alerts: alerts.map(alert => ({
        id: alert.id,
        event: alert.properties.event,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        headline: alert.properties.headline,
        description: alert.properties.description,
        onset: alert.properties.onset,
        expires: alert.properties.expires
      }))
    });
  } catch (error) {
    console.error('NWS Point Alert Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch point alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/nws/forecast/:locationName
 * Get weather forecast for a DFW location
 */
router.get('/forecast/:locationName', async (req, res) => {
  try {
    const location = findLocationByText(req.params.locationName);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    // Get grid endpoint first
    const pointResponse = await axios.get(
      `${NWS_BASE_URL}/points/${location.latitude},${location.longitude}`,
      { headers: NWS_HEADERS, timeout: 10000 }
    );

    const forecastUrl = pointResponse.data.properties.forecast;

    // Get forecast
    const forecastResponse = await axios.get(forecastUrl, {
      headers: NWS_HEADERS,
      timeout: 10000
    });

    const periods = forecastResponse.data.properties.periods || [];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        name: location.name,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      },
      forecast: periods.slice(0, 7).map(period => ({
        name: period.name,
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        windSpeed: period.windSpeed,
        windDirection: period.windDirection,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast
      }))
    });
  } catch (error) {
    console.error('NWS Forecast Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast',
      message: error.message
    });
  }
});

export default router;
