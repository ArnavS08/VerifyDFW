/**
 * Verdict Logic + Guardrail Overrides
 *
 * Evaluates extracted claim tags against live NWS alerts, PD incidents,
 * and ERCOT data to produce a final verdict, confidence, and explanation.
 *
 * Guardrail rule: tornado_touchdown and flooding claims can NEVER resolve
 * to "confirmed false/safe". If official feeds are quiet they stay
 * "unverified", never "contradicted".
 */

// NWS event strings that map to each claim type
const NWS_EVENT_MAP = {
  tornado_touchdown: [
    'Tornado Warning',
    'Tornado Emergency',
    'Tornado Watch',
  ],
  flooding: [
    'Flash Flood Warning',
    'Flash Flood Emergency',
    'Flood Warning',
    'Flash Flood Watch',
    'Flood Watch',
  ],
  siren_malfunction: [], // no NWS match; resolved via PD data only
  power_outage:      [], // resolved via ERCOT
  other:             [],
};

// High-stakes claim types that the guardrail protects
const HIGH_STAKES_TYPES = new Set(['tornado_touchdown', 'flooding']);

/**
 * Main verdict computation function.
 *
 * @param {object} params
 * @param {object} params.extracted     - LLM extraction output
 * @param {object|null} params.location - Resolved DFW location or null
 * @param {Array}  params.nwsAlerts     - NWS alert objects from Person 2's route
 * @param {Array}  params.pdIncidents   - PD incident objects from mock route
 * @param {object|null} params.ercotStatus - ERCOT location status object
 * @returns {{ verdict, confidence, explanation, sources }}
 */
export function computeVerdict({ extracted, location, nwsAlerts, pdIncidents, ercotStatus, usgsFlood }) {
  const { claim_type } = extracted;
  const sources = [];

  // Always include the NWS base source
  if (location) {
    sources.push(`https://api.weather.gov/alerts/active?zone=${location.nwsZoneId}`);
  } else {
    sources.push('https://api.weather.gov/alerts/active?area=TX');
  }
  sources.push('https://www.weather.gov/fwd/');

  // ── Tornado / Flooding — NWS-driven with guardrail ──────────────────────
  if (claim_type === 'tornado_touchdown' || claim_type === 'flooding') {
    return resolveWeatherClaim({ claim_type, nwsAlerts, pdIncidents, usgsFlood, sources, location });
  }

  // ── Power Outage — ERCOT-driven ──────────────────────────────────────────
  if (claim_type === 'power_outage') {
    return resolvePowerClaim({ ercotStatus, sources });
  }

  // ── Siren Malfunction — PD-driven ────────────────────────────────────────
  if (claim_type === 'siren_malfunction') {
    return resolveSirenClaim({ pdIncidents, sources });
  }

  // ── Other — default unverified ────────────────────────────────────────────
  return {
    verdict:     'unverified',
    confidence:  'low',
    explanation: 'No matching official data source could confirm or contradict this claim.',
    sources,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

  // ── USGS real-time flood gauge data (flooding claims only) ───────────────
  const activeUsgsFlooding = claim_type === 'flooding' && usgsFlood?.summary?.floodingDetected;
  const usgsGauges = claim_type === 'flooding' ? (usgsFlood?.gauges || []).filter(g => g.isFlooding) : [];
  if (usgsFlood?.sources) sources.push(...usgsFlood.sources);

  if (matchingAlerts.length > 0) {
    const topAlert = matchingAlerts[0];
    if (topAlert.id) sources.unshift(
      `https://api.weather.gov/alerts/${encodeURIComponent(topAlert.id)}`
    );

    const isHigh = topAlert.severity === 'Extreme' || topAlert.urgency === 'Immediate';
    return {
      verdict:    'confirmed',
      confidence: isHigh ? 'high' : 'medium',
      explanation: `An active NWS ${topAlert.event} is in effect for this area. ${
        topAlert.headline || ''
      }`.trim(),
      sources,
    };
  }

  // USGS gauge above flood stage — strong corroborating evidence even without NWS warning
  if (activeUsgsFlooding && usgsGauges.length > 0) {
    const topGauge = usgsGauges[0];
    const isMajor = topGauge.floodLevel === 'major';
    return {
      verdict:    'confirmed',
      confidence: isMajor ? 'high' : 'medium',
      explanation: `No active NWS flood warning found, but USGS stream gauge data shows ${topGauge.waterway} at ${topGauge.gageHeight} ft — above the ${topGauge.floodStage} ft flood stage threshold. Real-time flooding conditions are likely.`,
      sources,
    };
  }

  if (matchingPd.length > 0) {
    return {
      verdict:    'unverified',
      confidence: 'medium',
      explanation: `No active NWS warning found, but local PD reports ${matchingPd.length} active, verified incident(s) matching this claim type in the area.`,
      sources,
    };
  }

  // ── GUARDRAIL: high-stakes types never get "contradicted" ───────────────
  return {
    verdict:    'unverified',
    confidence: 'low',
    explanation: `No active NWS ${claim_type === 'tornado_touchdown' ? 'tornado' : 'flood'} warning is currently on record for this location. This claim could not be confirmed at this time. As always, we recommend staying informed through official NWS and local emergency channels. This analysis does not constitute a safety clearance.`,
    sources,
  };
}

function resolvePowerClaim({ ercotStatus, sources }) {
  sources.push('https://www.ercot.com/gridmktinfo/dashboardreports/loadforecast');

  if (!ercotStatus) {
    return {
      verdict:    'unverified',
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
      verdict:    'confirmed',
      confidence: 'high',
      explanation: `ERCOT data shows an active power outage in this area affecting approximately ${affected} customers.`,
      sources,
    };
  }

  if (gridNormal) {
    return {
      verdict:    'contradicted',
      confidence: 'high',
      explanation: `ERCOT is reporting normal grid conditions with no active outages for this location. The rolling blackout claim is not supported by official grid data.`,
      sources,
    };
  }

  return {
    verdict:    'unverified',
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
      verdict:    'confirmed',
      confidence: 'high',
      explanation: `Local PD logs contain a verified incident matching this siren report. This may indicate a known system test, malfunction, or active alert trigger.`,
      sources,
    };
  }

  return {
    verdict:    'unverified',
    confidence: 'low',
    explanation: 'No verified local PD records or municipal notices were found to explain the siren activity. Could be a test, malfunction, or unlogged event.',
    sources,
  };
}
