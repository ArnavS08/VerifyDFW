/**
 * Quick test script to verify all endpoints
 * Run with: node test/quickTest.js
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ ${name}: ${response.status}`);
    return { success: true, data };
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('\n🧪 Testing USAII Emergency Monitor API\n');
  
  // Test health
  await testEndpoint('Health Check', `${BASE_URL}/health`);
  
  // Test NWS endpoints
  console.log('\n📡 NWS Endpoints:');
  await testEndpoint('Active Alerts', `${BASE_URL}/api/nws/alerts/active`);
  await testEndpoint('Frisco Alerts', `${BASE_URL}/api/nws/alerts/location/frisco`);
  
  // Test Mock PD endpoints
  console.log('\n🚔 Police Department Endpoints:');
  await testEndpoint('All Incidents', `${BASE_URL}/api/mock/pd/incidents`);
  await testEndpoint('Dallas Incidents', `${BASE_URL}/api/mock/pd/location/dallas`);
  
  // Test Mock ERCOT endpoints
  console.log('\n⚡ ERCOT Endpoints:');
  await testEndpoint('Grid Status', `${BASE_URL}/api/mock/ercot/status`);
  await testEndpoint('Outages', `${BASE_URL}/api/mock/ercot/outages`);
  
  // Test comprehensive endpoint
  console.log('\n📊 Comprehensive Data:');
  const result = await testEndpoint(
    'Plano Comprehensive', 
    `${BASE_URL}/api/mock/comprehensive/plano`
  );
  
  if (result.success) {
    console.log('\n📋 Sample Data:');
    console.log(`   Location: ${result.data.location.name}`);
    console.log(`   Active Incidents: ${result.data.summary.active_pd_incidents}`);
    console.log(`   Power Outages: ${result.data.summary.power_outages}`);
  }
  
  console.log('\n✨ Test complete!\n');
}

runTests();
