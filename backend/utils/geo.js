/**
 * Відстань між двома точками в метрах (формула гаверсинуса).
 */
function distanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

/**
 * Чи студент у дозволеному радіусі від місця заняття.
 */
function isWithinRadius(
  lessonLat,
  lessonLon,
  studentLat,
  studentLon,
  radiusMeters
) {
  const distance = distanceMeters(
    lessonLat,
    lessonLon,
    studentLat,
    studentLon
  );

  return {
    ok: distance <= Number(radiusMeters),
    distanceMeters: distance,
    allowedRadiusMeters: Number(radiusMeters),
  };
}

module.exports = {
  distanceMeters,
  isWithinRadius,
};
