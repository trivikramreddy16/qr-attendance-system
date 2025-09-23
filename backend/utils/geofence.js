// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // Distance in meters

  return distance;
};

// Check if a point is within geofence
const isWithinGeofence = (userLat, userLon, geofenceLat, geofenceLon, radius) => {
  const distance = calculateDistance(userLat, userLon, geofenceLat, geofenceLon);
  return distance <= radius;
};

// Validate coordinates
const isValidCoordinates = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180 &&
    !isNaN(lat) && !isNaN(lon)
  );
};

// Get location accuracy level
const getAccuracyLevel = (accuracy) => {
  if (accuracy <= 5) return 'excellent';
  if (accuracy <= 10) return 'good';
  if (accuracy <= 20) return 'fair';
  if (accuracy <= 50) return 'poor';
  return 'very_poor';
};

// Validate geofence configuration
const validateGeofenceConfig = (geofence) => {
  if (!geofence || typeof geofence !== 'object') {
    return { valid: false, error: 'Geofence configuration is required' };
  }

  const { latitude, longitude, radius } = geofence;

  if (!isValidCoordinates(latitude, longitude)) {
    return { valid: false, error: 'Invalid geofence coordinates' };
  }

  if (typeof radius !== 'number' || radius < 1 || radius > 1000) {
    return { valid: false, error: 'Radius must be between 1 and 1000 meters' };
  }

  return { valid: true };
};

// Generate geofence for common locations
const getLocationGeofence = (locationName) => {
  const locations = {
    'classroom_block_n': {
      latitude: 17.4065,
      longitude: 78.4772,
      radius: 50
    },
    'classroom_block_s': {
      latitude: 17.4060,
      longitude: 78.4775,
      radius: 50
    },
    'lab_block': {
      latitude: 17.4070,
      longitude: 78.4770,
      radius: 30
    },
    'library': {
      latitude: 17.4063,
      longitude: 78.4773,
      radius: 40
    },
    'auditorium': {
      latitude: 17.4067,
      longitude: 78.4774,
      radius: 60
    }
  };

  return locations[locationName] || null;
};

module.exports = {
  calculateDistance,
  isWithinGeofence,
  isValidCoordinates,
  getAccuracyLevel,
  validateGeofenceConfig,
  getLocationGeofence
};