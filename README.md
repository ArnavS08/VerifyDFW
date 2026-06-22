# VerifyDFW

AI-powered emergency claim verification for DFW block leaders and community coordinators.

Paste a rumor, from a group chat, a tweet, or a forwarded message, and get an instant verdict backed by data before you pass it on.

---

## How It Works

1. You paste a raw claim (e.g. "I heard there's a tornado near Frisco")
2. A Llama 3.1 8B model (via Groq) extracts the location and emergency type
3. The backend queries live and simulated data sources in parallel
4. A verdict is returned: **Confirmed**, **Unverified**, or **Contradicted** — with a confidence level and plain English explanation
5. A pre-formatted message is generated to paste back into your group chat

---

## Data Sources

| Source | Status | What it covers |
|--------|--------|----------------|
| NWS (National Weather Service) | Live | Tornado, flood, and severe weather alerts by NWS zone |
| USGS Stream Gauges | Live | Flood stage readings for DFW waterways |
| ERCOT Grid Data | Simulated | Power outage and grid status across DFW |
| Local PD Feeds | Simulated | Road closures and active incident reports |

ERCOT and local PD data are simulated because no public API exists for these sources. In production, these would integrate with Oncor's outage map and city dispatch feeds.

---


## Running Locally

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your Groq API key to .env
npm start
```

Backend runs on `http://localhost:3003`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Notes

- The app targets the Dallas-Fort Worth metroplex. Claims referencing other regions will still process but NWS zone matching is optimized for DFW.
- Tornado and flood claims can never return "Contradicted" by design, the cost of a false negative is just way too high.
- The Twitter/X embed feature accepts any public tweet URL from twitter.com or x.com.
