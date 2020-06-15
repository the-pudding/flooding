function calculatingDistance(readerLat, readerLong, locLat, locLong) {
  // Haversine Formula
  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  const R = 3958.756; // miles
  const φ1 = toRadians(readerLat);
  const φ2 = toRadians(locLat);
  const Δφ = toRadians(locLat - readerLat);
  const Δλ = toRadians(locLong - readerLong);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function findNearest(readerLocation, data) {
  const locationDistance = data
    .map((d) => ({
      ...d,
      distance: calculatingDistance(
        readerLocation.latitude,
        readerLocation.longitude,
        +d.Latitude,
        +d.Longitude
      ),
    }))
    .filter((d) => !isNaN(d.distance));

  locationDistance.sort((a, b) => d3.ascending(b.distance, a.distance));
  return locationDistance.pop();
}

export default function findLocation(readerLocation, data) {
  return new Promise((resolve, reject) => {
    const locations = ['city', 'state', 'county', 'zip'];
    const nearestLocations = [];

    locations.forEach((d) => {
      // find just the data we're looking for
      const str = `${d}Data`;
      const theseData = data[str];

      // find nearest for that location
      const nearest = findNearest(readerLocation, theseData);

      // add it to the object nearestLocations
      nearestLocations[d] = nearest;
    });

    resolve(nearestLocations);
  });
}
