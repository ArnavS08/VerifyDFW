# Response Schema Documentation

This document describes the data structures returned by the USAII Emergency Monitor API and how they align with the claim verification schema.

## Claim Verification Schema

The system uses this schema for standardized claim verification responses:

```json
{
  "claim_text": "string",
  "extracted_location": "string",
  "claim_type": "tornado_touchdown | siren_malfunction | flooding | power_outage | other",
  "verdict": "confirmed | unverified | contradicted",
  "confidence": "high | medium | low",
  "explanation": "string",
  "sources": ["string"],
  "safety_disclaimer": "string"
}
```

## Mapping Data Sources to Claims

### Claim Types and Data Sources

| Claim Type | Primary Source | Secondary Source |
|------------|---------------|------------------|
| `tornado_touchdown` | NWS Alerts | PD Incidents |
| `flooding` | NWS Alerts | PD Incidents |
| `power_outage` | ERCOT Status | PD Incidents |
| `siren_malfunction` | PD Incidents | - |
| `other` | All Sources | - |

### Verdict Determination Logic

#### `confirmed` (High Confidence)
- Multiple sources verify the claim
- At least one official source (NWS or ERCOT) confirms
- PD incident marked as `verified: true`

#### `confirmed` (Medium Confidence)
- Single official source confirms
- PD incident matches but not yet verified

#### `unverified` (Medium Confidence)
- Single unverified source mentions similar event
- Location matches but details differ
- Timing is close but not exact

#### `unverified` (Low Confidence)
- No matching data in any source
- Location is too far from any incidents
- No recent relevant alerts or incidents

#### `contradicted` (High Confidence)
- Official sources explicitly state opposite
- Example: Claim says "power out" but ERCOT shows no outages
- Timing doesn't match (claim says "now" but incident was hours ago)

## Data Source Structures

### NWS Alert Structure

```json
{
  "id": "urn:oid:2.49.0.1.840.0.xxx",
  "event": "Tornado Warning",
  "severity": "severe | moderate | minor",
  "urgency": "immediate | expected | future",
  "certainty": "observed | likely | possible",
  "headline": "string",
  "description": "string",
  "instruction": "string",
  "onset": "2026-06-17T12:00:00-05:00",
  "expires": "2026-06-17T13:00:00-05:00",
  "affected_zones": ["TXZ103", "TXZ104"],
  "affected_areas": "Collin County; Dallas County",
  "sent": "2026-06-17T11:55:00-05:00"
}
```

### PD Incident Structure

```json
{
  "id": "PD-2026-001234",
  "timestamp": "2026-06-17T10:00:00.000Z",
  "location": "frisco",
  "incident_type": "weather_emergency | flooding | power_outage | severe_weather",
  "severity": "high | medium | low",
  "description": "string",
  "status": "active | investigating | resolved",
  "units_dispatched": 6,
  "verified": true,
  "location_details": {
    "name": "Frisco",
    "county": "Collin",
    "coordinates": {
      "latitude": 33.1507,
      "longitude": -96.8236
    }
  }
}
```

### ERCOT Outage Structure

```json
{
  "region": "North Central",
  "affected_areas": ["Downtown Dallas", "Irving"],
  "customers_affected": 3450,
  "estimated_restoration": "2026-06-17T14:00:00.000Z",
  "cause": "severe_weather | equipment_failure | planned_maintenance",
  "status": "crews_dispatched | under_repair | resolved"
}
```

## Example Verification Workflows

### Workflow 1: Tornado Claim

**Input:**
```json
{
  "claim_text": "Tornado spotted near Preston Road in Frisco",
  "user_location": "Frisco"
}
```

**Process:**
1. Query `/api/nws/alerts/location/frisco`
2. Query `/api/mock/pd/location/frisco`
3. Check for tornado-related alerts and incidents
4. Calculate confidence based on matches

**Output:**
```json
{
  "claim_text": "Tornado spotted near Preston Road in Frisco",
  "extracted_location": "Frisco",
  "claim_type": "tornado_touchdown",
  "verdict": "confirmed",
  "confidence": "high",
  "explanation": "Multiple sources confirm tornado activity in Frisco. NWS issued tornado warning and PD has verified incident reports.",
  "sources": ["National Weather Service", "Frisco Police Department"],
  "safety_disclaimer": "If you are in the affected area, seek shelter immediately in a basement or interior room on the lowest floor."
}
```

### Workflow 2: Power Outage Claim

**Input:**
```json
{
  "claim_text": "Power is out in downtown Dallas",
  "user_location": "Dallas"
}
```

**Process:**
1. Query `/api/mock/ercot/location/downtown dallas`
2. Query `/api/mock/pd/location/dallas`
3. Check power outage status
4. Cross-reference with incidents

**Output:**
```json
{
  "claim_text": "Power is out in downtown Dallas",
  "extracted_location": "Downtown Dallas",
  "claim_type": "power_outage",
  "verdict": "confirmed",
  "confidence": "high",
  "explanation": "ERCOT reports active outage affecting Downtown Dallas area. Approximately 3,450 customers affected. Estimated restoration in 2 hours.",
  "sources": ["ERCOT Grid Status", "Dallas Police Department"],
  "safety_disclaimer": "Avoid downed power lines and report them to authorities. Use flashlights instead of candles."
}
```

### Workflow 3: Unverified Claim

**Input:**
```json
{
  "claim_text": "Heard sirens in Mesquite",
  "user_location": "Mesquite"
}
```

**Process:**
1. Query all sources for Mesquite
2. No specific incidents found
3. Check NWS for any alerts

**Output:**
```json
{
  "claim_text": "Heard sirens in Mesquite",
  "extracted_location": "Mesquite",
  "claim_type": "other",
  "verdict": "unverified",
  "confidence": "low",
  "explanation": "No matching incidents or alerts found in monitoring systems. Sirens could be routine emergency response.",
  "sources": [],
  "safety_disclaimer": "If you observe an emergency, call 911 immediately."
}
```

## Safety Disclaimers by Claim Type

### Tornado
> "If you are in the affected area, seek shelter immediately in a basement or interior room on the lowest floor. Stay away from windows."

### Flooding
> "Do not attempt to drive through flooded areas. Turn around, don't drown. Six inches of water can knock you off your feet."

### Power Outage
> "Avoid downed power lines and report them to authorities. Use flashlights instead of candles. Keep refrigerator and freezer doors closed."

### Siren Malfunction
> "If you do not observe dangerous weather conditions, monitor official weather sources. Do not rely solely on outdoor sirens."

### Other
> "If you observe an emergency situation, call 911 immediately. Follow instructions from local authorities."

## Confidence Scoring Guidelines

### High Confidence (85-100%)
- Multiple independent sources confirm
- Official sources involved (NWS, ERCOT)
- Recent timestamp (within last 2 hours)
- Exact location match

### Medium Confidence (50-84%)
- Single reliable source confirms
- Approximate location match
- Recent but not immediate (2-6 hours)
- Similar but not exact description

### Low Confidence (0-49%)
- No source confirmation
- Distant location or old timestamp
- Contradictory information
- Vague or generic claim

## Integration with Frontend

Frontend should:
1. Extract location from user text using `/api/mock/comprehensive/:location`
2. Analyze claim type keywords (tornado, flood, power, etc.)
3. Apply verdict logic based on data sources
4. Select appropriate safety disclaimer
5. Display sources with timestamps
6. Show confidence level visually

## Rate Limiting & Caching Recommendations

- Cache NWS alerts for 5 minutes
- Cache ERCOT status for 2 minutes
- Cache PD incidents for 1 minute
- Implement exponential backoff for NWS API errors
- Consider WebSocket updates for real-time monitoring
