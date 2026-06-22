const NWS_EVENT_MAP = {
  tornado_touchdown: ['Tornado Warning', 'Tornado Emergency', 'Tornado Watch'],
  flooding: ['Flash Flood Warning', 'Flash Flood Emergency', 'Flood Warning', 'Flash Flood Watch', 'Flood Watch'],
  siren_malfunction: [],
  power_outage: [],
  other: [],
};

export function computeVerdict({ extracted, location, nwsAlerts, pdIncidents, ercotStatus, usgsFlood }) {
  const { claim_type } = extracted;
  const sources = [];

  if (location) {
    sources.push(`https://api.weather.gov/alerts/active?zone=${location.nwsZoneId}`);
  } else {
    sources.push('https://api.weather.gov/alerts/active?area=TX');
  }
  sources.push('https://www.weather.gov/fwd/');

  if (claim_type === 'tornado_touchdown' || claim_type === 'flooding') {
    return resolveWeatherClaim({ claim_type, nwsAlerts, pdIncidents, usgsFlood, sources, location });
  }

  if (claim_type === 'power_outage') {
    return resolvePowerClaim({ ercotStatus, sources });
  }

  if (claim_type === 'siren_malfunction') {
    return resolveSirenClaim({ pdIncidents, sources });
  }

  return {
    verdict: 'unverified',
    confidence: 'low',
    explanation: 'No matching official data source could confirm or contradict this claim.',
    sources,
  };
}

function resolveWeatherClaim({ claim_type, nwsAlerts, pdIncidents, usgsFlood, sources, location }) {
  const relevantNwsEvents = NWS_EVENT_MAP[claim_type];

  const matchingAlerts = nwsAlerts.filter(alert =>
    relevantNwsEvents.some(eventName =>
      alert.event?.toLowerCase().includes(eventName.toLowerCase())
    )
  );

  const matchingPd = pdIncidents.filter(inc =>
    inc.incident_type === (claim_type === 'tornado_touchdown' ? 'weather_emergency' : 'flooding') &&
    inc.verified === true &&
    inc.status === 'active'
  );

  const activeUsgsFlooding = claim_type === 'flooding' && usgsFlood?.summary?.floodingDetected;
  const usgsGauges = claim_type === 'flooding' ? (usgsFlood?.gauges || []).filter(g => g.isFlooding) : [];
  if (usgsFlood?.sources) sources.push(...usgsFlood.sources);

  if (matchingAlerts.length > 0) {
    const topAlert = matchingAlerts[0];
    if (topAlert.id) sources.unshift(`https://api.weather.gov/alerts/${encodeURIComponent(topAlert.id)}`);
    const isHigh = topAlert.severity === 'Extreme' || topAlert.urgency === 'Immediate';
    return {
      verdict: 'confirmed',
      confidence: isHigh ? 'high' : 'medium',
      explanation: `An active NWS ${topAlert.event} is in effect for this area. ${topAlert.headline || ''}`.trim(),
      sources,
    };
  }

  if (activeUsgsFlooding && usgsGauges.length > 0) {
    const topGauge = usgsGauges[0];
    const isMajor = topGauge.floodLevel === 'major';
    return {
      verdict: 'confirmed',
      confidence: isMajor ? 'high' : 'medium',
      explanation: `No active NWS flood warning found, but USGS stream gauge data shows ${topGauge.waterway} at ${topGauge.gageHeight} ft — above the ${topGauge.floodStage} ft flood stage threshold. Real-time flooding conditions are likely.`,
      sources,
    };
  }

  if (matchingPd.length > 0) {
    return {
      verdict: 'unverified',
      confidence: 'medium',
      explanation: `No active NWS warning found, but local PD reports ${matchingPd.length} active, verified incident(s) matching this claim type in the area.`,
      sources,
    };
  }

  // Tornado and flood claims never return "contradicted" — safety guardrail
  return {
    verdict: 'unverified',
    confidence: 'low',
    explanation: `No active NWS ${claim_type === 'tornado_touchdown' ? 'tornado' : 'flood'} warning is currently on record for this location. Treat as unverified until official confirmation. Do not assume it is safe.`,
    sources,
  };
}

function resolvePowerClaim({ ercotStatus, sources }) {
  sources.push('https://www.ercot.com/gridmktinfo/dashboardreports/loadforecast');

  if (!ercotStatus) {
    return {
      verdict: 'unverified',
      confidence: 'low',
      explanation: 'ERCOT grid data was unavailable. Cannot confirm or contradict this power outage claim.',
      sources,
    };
  }

  const hasOutage = ercotStatus.power_status === 'outage' || ercotStatus.outages?.length > 0;
  const gridNormal = ercotStatus.grid_status === 'normal';

  if (hasOutage) {
    const affected = ercotStatus.outages?.[0]?.customers_affected ?? 'an unknown number of';
    return {
      verdict: 'confirmed',
      confidence: 'high',
      explanation: `ERCOT data shows an active power outage in this area affecting approximately ${affected} customers.`,
      sources,
    };
  }

  if (gridNormal) {
    return {
      verdict: 'contradicted',
      confidence: 'high',
      explanation: `ERCOT is reporting normal grid conditions with no active outages for this location. The rolling blackout claim is not supported by official grid data.`,
      sources,
    };
  }

  return {
    verdict: 'unverified',
    confidence: 'medium',
    explanation: 'ERCOT grid status is elevated but no specific outage is confirmed for this area.',
    sources,
  };
}

function resolveSirenClaim({ pdIncidents, sources }) {
  const sirenIncidents = pdIncidents.filter(inc =>
    inc.incident_type === 'weather_emergency' || inc.description?.toLowerCase().includes('siren')
  );

  if (sirenIncidents.length > 0 && sirenIncidents.some(i => i.verified)) {
    return {
      verdict: 'confirmed',
      confidence: 'high',
      explanation: 'Local PD logs contain a verified incident matching this siren report. This may indicate a known system test, malfunction, or active alert trigger.',
      sources,
    };
  }

  return {
    verdict: 'unverified',
    confidence: 'low',
    explanation: 'No verified local PD records or municipal notices were found to explain the siren activity.',
    sources,
  };
}
