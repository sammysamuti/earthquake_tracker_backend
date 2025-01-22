const ETHIOPIA_BOUNDS = {
  north: 15.0,
  south: 3.4,
  east: 48.0,
  west: 33.0,
};

exports.isInEthiopia = (lat, lng) => {
  return (
    lat >= ETHIOPIA_BOUNDS.south &&
    lat <= ETHIOPIA_BOUNDS.north &&
    lng >= ETHIOPIA_BOUNDS.west &&
    lng <= ETHIOPIA_BOUNDS.east
  );
};
