export const DFW_LOCATIONS = {
  frisco: {
    name: "Frisco",
    latitude: 33.1507,
    longitude: -96.8236,
    nwsGridZone: "FWD/76,104",
    nwsZoneId: "TXZ104",
    countyZone: "TXC085", // Collin County
    county: "Collin",
    population: 200000,
    aliases: ["frisco", "frisco tx", "frisco texas"]
  },
  plano: {
    name: "Plano",
    latitude: 33.0198,
    longitude: -96.6989,
    nwsGridZone: "FWD/77,100",
    nwsZoneId: "TXZ104",
    countyZone: "TXC085", // Collin County
    county: "Collin",
    population: 285000,
    aliases: ["plano", "plano tx", "plano texas"]
  },
  downtown_dallas: {
    name: "Downtown Dallas",
    latitude: 32.7767,
    longitude: -96.7970,
    nwsGridZone: "FWD/78,98",
    nwsZoneId: "TXZ103",
    countyZone: "TXC113", // Dallas County
    county: "Dallas",
    population: 1300000,
    aliases: ["downtown dallas", "dallas", "dallas tx", "downtown"]
  },
  arlington: {
    name: "Arlington",
    latitude: 32.7357,
    longitude: -97.1081,
    nwsGridZone: "FWD/73,97",
    nwsZoneId: "TXZ119",
    countyZone: "TXC113", // Tarrant County
    county: "Tarrant",
    population: 400000,
    aliases: ["arlington", "arlington tx"]
  },
  fort_worth: {
    name: "Fort Worth",
    latitude: 32.7555,
    longitude: -97.3308,
    nwsGridZone: "FWD/70,97",
    nwsZoneId: "TXZ119",
    countyZone: "TXC439", // Tarrant County
    county: "Tarrant",
    population: 950000,
    aliases: ["fort worth", "ft worth", "fortworth"]
  },
  irving: {
    name: "Irving",
    latitude: 32.8140,
    longitude: -96.9489,
    nwsGridZone: "FWD/75,98",
    nwsZoneId: "TXZ119",
    countyZone: "TXC113", // Dallas County
    county: "Dallas",
    population: 240000,
    aliases: ["irving", "irving tx"]
  },
  mckinney: {
    name: "McKinney",
    latitude: 33.1972,
    longitude: -96.6154,
    nwsGridZone: "FWD/78,105",
    nwsZoneId: "TXZ104",
    countyZone: "TXC085", // Collin County
    county: "Collin",
    population: 200000,
    aliases: ["mckinney", "mckinney tx"]
  },
  denton: {
    name: "Denton",
    latitude: 33.2148,
    longitude: -97.1331,
    nwsGridZone: "FWD/73,106",
    nwsZoneId: "TXZ103",
    countyZone: "TXC121", // Denton County
    county: "Denton",
    population: 150000,
    aliases: ["denton", "denton tx"]
  },
  garland: {
    name: "Garland",
    latitude: 32.9126,
    longitude: -96.6389,
    nwsGridZone: "FWD/78,99",
    nwsZoneId: "TXZ104",
    countyZone: "TXC113", // Dallas County
    county: "Dallas",
    population: 240000,
    aliases: ["garland", "garland tx"]
  },
  mesquite: {
    name: "Mesquite",
    latitude: 32.7668,
    longitude: -96.5991,
    nwsGridZone: "FWD/79,98",
    nwsZoneId: "TXZ104",
    countyZone: "TXC113", // Dallas County
    county: "Dallas",
    population: 150000,
    aliases: ["mesquite", "mesquite tx"]
  }
};

/**
 * Texas NWS Zone Mapping for DFW Metro
 */
export const TEXAS_NWS_ZONES = {
  TXZ103: "Dallas County",
  TXZ104: "Collin County",
  TXZ119: "Tarrant County",
  TXZ120: "Rockwall County",
  TXZ121: "Denton County"
};

export function findLocationByText(locationText) {
  if (!locationText) return null;
  const normalizedInput = locationText.toLowerCase().trim();
  for (const [key, location] of Object.entries(DFW_LOCATIONS)) {
    if (location.aliases.some(alias => normalizedInput.includes(alias))) {
      return { id: key, ...location };
    }
  }
  return null;
}

export function getLocationsByCounty(county) {
  return Object.entries(DFW_LOCATIONS)
    .filter(([_, location]) => location.county === county)
    .map(([id, location]) => ({ id, ...location }));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function findNearestLocation(latitude, longitude) {
  let nearest = null;
  let minDistance = Infinity;
  for (const [id, location] of Object.entries(DFW_LOCATIONS)) {
    const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { id, ...location, distance };
    }
  }
  return nearest;
}
