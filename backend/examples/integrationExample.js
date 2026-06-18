/**
 * Integration Example: Multi-Source Claim Verification
 * Demonstrates how to verify emergency claims using all data sources
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Verify a user claim by checking multiple data sources
 */
async function verifyEmergencyClaim(claimText, location) {
  console.log(`\n🔍 Verifying Claim: "${claimText}"`);
  console.log(`📍 Location: ${location}\n`);

  try {
    // 1. Get comprehensive data for the location
    const response = await fetch(
      `${BASE_URL}/api/mock/comprehensive/${encodeURIComponent(location)}`
    );
    const data = await response.json();

    if (!data.success) {
      return {
        verdict: 'unverified',
        confidence: 'low',
        explanation: 'Location not found in monitoring system'
      };
    }

    // 2. Analyze claim type and match with data sources
    const claimLower = claimText.toLowerCase();
    let matches = [];
    let contradictions = [];

    // Check for tornado mentions
    if (claimLower.includes('tornado')) {
      const tornadoIncidents = data.pd_incidents.filter(inc =>
        inc.description.toLowerCase().includes('tornado')
      );
      
      if (tornadoIncidents.length > 0) {
        matches.push({
          source: 'Police Department',
          evidence: tornadoIncidents[0].description,
          verified: tornadoIncidents[0].verified
        });
      }
    }

    // Check for flooding mentions
    if (claimLower.includes('flood')) {
      const floodIncidents = data.pd_incidents.filter(inc =>
        inc.incident_type === 'flooding'
      );
      
      if (floodIncidents.length > 0) {
        matches.push({
          source: 'Police Department',
          evidence: floodIncidents[0].description,
          verified: floodIncidents[0].verified
        });
      }
    }

    // Check for power outage mentions
    if (claimLower.includes('power') || claimLower.includes('outage')) {
      if (data.power_status.has_outage) {
        matches.push({
          source: 'ERCOT',
          evidence: `${data.summary.customers_affected} customers affected`,
          verified: true
        });
      } else if (claimLower.includes('power') && claimLower.includes('out')) {
        contradictions.push({
          source: 'ERCOT',
          evidence: 'No power outages reported in this area'
        });
      }
    }

    // 3. Determine verdict
    let verdict, confidence, explanation;

    if (matches.length >= 2) {
      verdict = 'confirmed';
      confidence = 'high';
      explanation = `Multiple sources confirm this claim. ${matches.length} matching reports found.`;
    } else if (matches.length === 1 && matches[0].verified) {
      verdict = 'confirmed';
      confidence = 'medium';
      explanation = 'One verified source confirms this claim.';
    } else if (matches.length === 1) {
      verdict = 'unverified';
      confidence = 'medium';
      explanation = 'One unverified report matches this claim.';
    } else if (contradictions.length > 0) {
      verdict = 'contradicted';
      confidence = 'high';
      explanation = 'Official sources contradict this claim.';
    } else {
      verdict = 'unverified';
      confidence = 'low';
      explanation = 'No matching reports found in monitoring systems.';
    }

    // 4. Build response
    return {
      claim_text: claimText,
      extracted_location: data.location.name,
      verdict,
      confidence,
      explanation,
      sources: matches.map(m => m.source),
      evidence: matches,
      contradictions,
      timestamp: new Date().toISOString(),
      location_details: {
        county: data.location.county,
        coordinates: data.location.coordinates
      },
      context: {
        active_incidents: data.summary.active_pd_incidents,
        power_outages: data.summary.power_outages,
        customers_affected: data.summary.customers_affected
      }
    };

  } catch (error) {
    console.error('Verification Error:', error);
    return {
      verdict: 'unverified',
      confidence: 'low',
      explanation: `System error: ${error.message}`
    };
  }
}

/**
 * Example usage scenarios
 */
async function runExamples() {
  console.log('🚨 USAII Emergency Claim Verification Examples\n');
  console.log('='.repeat(60));

  // Example 1: Tornado claim
  const result1 = await verifyEmergencyClaim(
    'I just saw a tornado touchdown near Preston Road in Frisco!',
    'Frisco'
  );
  console.log('\n📊 Result 1:');
  console.log(`   Verdict: ${result1.verdict}`);
  console.log(`   Confidence: ${result1.confidence}`);
  console.log(`   Explanation: ${result1.explanation}`);
  console.log(`   Sources: ${result1.sources.join(', ') || 'None'}`);

  // Example 2: Power outage claim
  const result2 = await verifyEmergencyClaim(
    'Power is out in downtown Dallas, traffic lights not working',
    'Downtown Dallas'
  );
  console.log('\n📊 Result 2:');
  console.log(`   Verdict: ${result2.verdict}`);
  console.log(`   Confidence: ${result2.confidence}`);
  console.log(`   Explanation: ${result2.explanation}`);
  console.log(`   Sources: ${result2.sources.join(', ') || 'None'}`);

  // Example 3: Flooding claim
  const result3 = await verifyEmergencyClaim(
    'Street flooding on Legacy Drive in Plano',
    'Plano'
  );
  console.log('\n📊 Result 3:');
  console.log(`   Verdict: ${result3.verdict}`);
  console.log(`   Confidence: ${result3.confidence}`);
  console.log(`   Explanation: ${result3.explanation}`);
  console.log(`   Sources: ${result3.sources.join(', ') || 'None'}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Examples complete!\n');
}

// Run if executed directly
runExamples();
