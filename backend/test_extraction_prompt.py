"""
Quick smoke test for the extraction prompt.
Run with: python backend/test_extraction_prompt.py

Requires: pip install openai python-dotenv
Set OPENAI_API_KEY in a .env file or your environment.
"""

import os
import json
from openai import OpenAI
from prompts import EXTRACTION_SYSTEM_PROMPT

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# (claim_text, expected_location, expected_claim_type, expected_verdict, expected_confidence)
TEST_SCENARIOS = [
    ("Guys my sister just texted me saying a literal tornado just touched down right next to the Stonebriar Centre mall in Frisco and the outdoor sirens aren't even going off. Everyone near Preston Road needs to take cover in a basement right now!!", "Stonebriar Centre, Frisco", "tornado_touchdown", "unverified", "low"),
    ("Do not try to drive down Legacy Drive near Legacy West or the Tollway. The road is completely underwater from the storm and three cars are literally floating. Police have the whole area blocked off.", "Legacy West, Plano", "flooding", "unverified", "low"),
    ("Just got a heads up from an inside source that ERCOT is losing control of the grid because of the heat wave. They are initiating mandatory 2-hour rolling blackouts across Frisco and Plano starting at 4 PM today. Charge your phones now.", "Frisco and Plano", "power_outage", "unverified", "low"),
    ("Hey block leaders, parents are saying on Facebook that Frisco ISD is canceling all after-school activities and releasing students early today at 1 PM because of the severe hail storm threat. Can anyone confirm this?", "Frisco ISD", "other", "unverified", "low"),
    ("The weather radio just went off for a Tornado Warning in Collin County near McKinney. Is this real or just a test?", "McKinney, Collin County", "tornado_touchdown", "unverified", "low"),
    ("Massive baseball-sized hail is falling right now near the PGA Headquarters on PGA Parkway. It's shattering windshields in the parking lot!!", "PGA Parkway, Frisco", "other", "unverified", "low"),
    ("The emergency sirens in Downtown Dallas have been blaring non-stop for the last 30 minutes but there isn't a single cloud in the sky. Is Dallas under a cyberattack or are the city systems just broken again?", "Downtown Dallas", "siren_malfunction", "unverified", "low"),
    ("Major emergency response on the Dallas North Tollway near Eldorado Parkway. All northbound lanes are completely shut down due to a massive multi-car accident. Avoid the tollway completely.", "Dallas North Tollway and Eldorado Parkway, Frisco", "other", "unverified", "low"),
]

TEST_CLAIMS = [
    # Scenario 1 — expected: tornado_touchdown, unverified, low
    "Guys my sister just texted me saying a literal tornado just touched down right next to the Stonebriar Centre mall in Frisco and the outdoor sirens aren't even going off. Everyone near Preston Road needs to take cover in a basement right now!!",
    # Scenario 2 — expected: flooding, confirmed/unverified depending on NWS, high/medium
    "Do not try to drive down Legacy Drive near Legacy West or the Tollway. The road is completely underwater from the storm and three cars are literally floating. Police have the whole area blocked off.",
    # Scenario 3 — expected: power_outage, contradicted, high
    "Just got a heads up from an inside source that ERCOT is losing control of the grid because of the heat wave. They are initiating mandatory 2-hour rolling blackouts across Frisco and Plano starting at 4 PM today. Charge your phones now.",
    # Scenario 4 — expected: other, unverified, low
    "Hey block leaders, parents are saying on Facebook that Frisco ISD is canceling all after-school activities and releasing students early today at 1 PM because of the severe hail storm threat. Can anyone confirm this?",
    # Scenario 5 — expected: tornado_touchdown, confirmed, high
    "The weather radio just went off for a Tornado Warning in Collin County near McKinney. Is this real or just a test?",
    # Scenario 6 — expected: other, confirmed/unverified, medium
    "Massive baseball-sized hail is falling right now near the PGA Headquarters on PGA Parkway. It's shattering windshields in the parking lot!!",
    # Scenario 7 — expected: siren_malfunction, confirmed, high
    "The emergency sirens in Downtown Dallas have been blaring non-stop for the last 30 minutes but there isn't a single cloud in the sky. Is Dallas under a cyberattack or are the city systems just broken again?",
    # Scenario 8 — expected: other, unverified, low
    "Major emergency response on the Dallas North Tollway near Eldorado Parkway. All northbound lanes are completely shut down due to a massive multi-car accident. Avoid the tollway completely.",
]

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

for i, (claim, exp_location, exp_claim_type, exp_verdict, exp_confidence) in enumerate(TEST_SCENARIOS, 1):
    print(f"\n── Scenario {i} ──────────────────────────────────────────")
    print(f"Input: {claim[:80]}...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": claim},
        ],
        temperature=0,
    )
    raw = response.choices[0].message.content
    try:
        parsed = json.loads(raw)
        loc_pass   = "✅" if exp_location.lower() in parsed["extracted_location"].lower() else "❌"
        type_pass  = "✅" if parsed["claim_type"] == exp_claim_type else "❌"
        # verdict and confidence are always unverified/low at extraction time
        verd_pass  = "✅" if parsed["verdict"] == "unverified" else "❌"
        conf_pass  = "✅" if parsed["confidence"] == "low" else "❌"
        print(f"  {loc_pass} location   : {parsed['extracted_location']} (expected: {exp_location})")
        print(f"  {type_pass} claim_type : {parsed['claim_type']} (expected: {exp_claim_type})")
        print(f"  {verd_pass} verdict    : {parsed['verdict']} (expected: unverified)")
        print(f"  {conf_pass} confidence : {parsed['confidence']} (expected: low)")
        print(f"     explanation: {parsed['explanation']}")
    except json.JSONDecodeError:
        print(f"  ❌ ERROR: model returned non-JSON:\n{raw}")
