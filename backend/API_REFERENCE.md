# API Quick Reference

Base URL: `http://localhost:3000`

## 📡 National Weather Service (NWS) - Live Data

### Get Active Texas Alerts
```http
GET /api/nws/alerts/active
```
Returns all active NWS alerts for Texas, filtered to DFW metro zones.

### Get Alerts for Location
```http
GET /api/nws/alerts/location/:locationName
```
**Example:** `/api/nws/alerts/location/frisco`

Returns weather alerts specific to that location's NWS zone.

### Get Alerts for Coordinates
```http
GET /api/nws/alerts/point/:lat/:lon
```
**Example:** `/api/nws/alerts/point/33.1507/-96.8236`

Returns alerts for specific GPS coordinates.

### Get Weather Forecast
```http
GET /api/nws/forecast/:locationName
```
**Example:** `/api/nws/forecast/plano`

Returns 7-day weather forecast for the location.

---

## 🚔 Police Department (Mock Data)

### Get All Incidents
```http
GET /api/mock/pd/incidents
```
**Query Params:**
- `location` - Filter by location name
- `severity` - Filter by severity (high, medium, low)
- `status` - Filter by status (active, investigating, resolved)

**Example:** `/api/mock/pd/incidents?severity=high&status=active`

### Get Specific Incident
```http
GET /api/mock/pd/incidents/:id
```
**Example:** `/api/mock/pd/incidents/PD-2026-001234`

### Get Incidents by Location
```http
GET /api/mock/pd/location/:locationName
```
**Example:** `/api/mock/pd/location/dallas`

---

## ⚡ ERCOT Power Grid (Mock Data)

### Get Grid Status
```http
GET /api/mock/ercot/status
```
Returns current power grid status, demand, capacity, and alerts.

### Get Power Outages
```http
GET /api/mock/ercot/outages
```
**Query Params:**
- `location` - Filter by location name

**Example:** `/api/mock/ercot/outages?location=frisco`

### Get Location Power Status
```http
GET /api/mock/ercot/location/:locationName
```
**Example:** `/api/mock/ercot/location/arlington`

Returns power status specific to that location.

---

## 📊 Comprehensive Multi-Source

### Get All Data for Location
```http
GET /api/mock/comprehensive/:locationName
```
**Example:** `/api/mock/comprehensive/downtown dallas`

Returns aggregated data from all sources:
- Location metadata
- Summary statistics
- PD incidents
- Power status
- NWS alerts (via other endpoint)

---

## 🏙️ Supported Locations

| Location | County | Aliases |
|----------|--------|---------|
| Frisco | Collin | frisco, frisco tx |
| Plano | Collin | plano, plano tx |
| Downtown Dallas | Dallas | downtown dallas, dallas, downtown |
| Arlington | Tarrant | arlington, arlington tx |
| Fort Worth | Tarrant | fort worth, ft worth, fortworth |
| Irving | Dallas | irving, irving tx |
| McKinney | Collin | mckinney, mckinney tx |
| Denton | Denton | denton, denton tx |
| Garland | Dallas | garland, garland tx |
| Mesquite | Dallas | mesquite, mesquite tx |

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "timestamp": "2026-06-17T12:00:00.000Z",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed message"
}
```

---

## 🔧 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 404 | Not Found (invalid location or ID) |
| 500 | Server Error (NWS API failure, etc.) |

---

## 💡 Quick Examples

### Check if Frisco has active emergencies
```bash
curl http://localhost:3000/api/mock/comprehensive/frisco | json_pp
```

### Get high-severity incidents only
```bash
curl "http://localhost:3000/api/mock/pd/incidents?severity=high"
```

### Monitor power grid
```bash
curl http://localhost:3000/api/mock/ercot/status | json_pp
```

### Get real NWS tornado warnings
```bash
curl http://localhost:3000/api/nws/alerts/active | json_pp
```

---

## 🎯 Common Integration Patterns

### Pattern 1: Verify Emergency Claim
```
1. Extract location from claim text
2. GET /api/mock/comprehensive/:location
3. Check summary.active_pd_incidents
4. Check power_status.has_outage
5. Cross-reference with claim type
6. Return verdict + confidence
```

### Pattern 2: Real-Time Dashboard
```
Every 5 minutes:
  - GET /api/nws/alerts/active
  
Every 2 minutes:
  - GET /api/mock/ercot/status
  
Every 1 minute:
  - GET /api/mock/pd/incidents?status=active
```

### Pattern 3: Location Search
```
User types: "downtown"
1. Call findLocationByText("downtown")
2. Returns: Downtown Dallas
3. GET /api/mock/comprehensive/downtown dallas
4. Display results
```

---

## 🚀 Testing Commands

### Test Health
```bash
curl http://localhost:3000/health
```

### Test All Endpoints
```bash
node test/quickTest.js
```

### Run Integration Example
```bash
node examples/integrationExample.js
```

---

## ⚙️ Configuration

### Environment Variables
```bash
PORT=3000              # Server port
NODE_ENV=development   # Environment
```

### Headers Required by NWS
```http
User-Agent: (USAII Emergency Monitor, contact@example.com)
Accept: application/geo+json
```
*Already configured in nws.js*

---

## 📚 Additional Resources

- **Full Documentation:** [README.md](README.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Schema Details:** [docs/SCHEMA.md](docs/SCHEMA.md)
- **Implementation:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
