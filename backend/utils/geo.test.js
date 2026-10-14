const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { distanceMeters, isWithinRadius } = require('./geo');

describe('distanceMeters', () => {
  it('returns 0 for the same point', () => {
    const distance = distanceMeters(48.74, 25.39, 48.74, 25.39);
    assert.equal(distance, 0);
  });

  it('returns a small distance for nearby points (~10 m)', () => {
    // ~0.00009 deg latitude ≈ 10 meters
    const distance = distanceMeters(48.74, 25.39, 48.74009, 25.39);
    assert.ok(distance > 8);
    assert.ok(distance < 12);
  });

  it('returns large distance for lesson vs phone from real case', () => {
    // Lesson: 48.74, 25.39
    // Phone:  48.525441, 25.403025
    const distance = distanceMeters(
      48.74,
      25.39,
      48.525441,
      25.403025
    );

    // ~24 km apart
    assert.ok(distance > 20000);
    assert.ok(distance < 30000);
  });
});

describe('isWithinRadius', () => {
  it('allows student inside 100 m radius', () => {
    const result = isWithinRadius(
      48.74,
      25.39,
      48.74005,
      25.39,
      100
    );

    assert.equal(result.ok, true);
    assert.ok(result.distanceMeters < 100);
    assert.equal(result.allowedRadiusMeters, 100);
  });

  it('blocks student outside 100 m radius (real phone vs lesson)', () => {
    const result = isWithinRadius(
      48.74,
      25.39,
      48.525441,
      25.403025,
      100
    );

    assert.equal(result.ok, false);
    assert.ok(result.distanceMeters > 100);
    assert.equal(result.allowedRadiusMeters, 100);
  });

  it('allows the same coordinates', () => {
    const result = isWithinRadius(
      48.525441,
      25.403025,
      48.525441,
      25.403025,
      100
    );

    assert.equal(result.ok, true);
    assert.equal(result.distanceMeters, 0);
  });

  it('blocks when distance is just above radius', () => {
    // ~150 m north of lesson point
    const result = isWithinRadius(
      48.74,
      25.39,
      48.74135,
      25.39,
      100
    );

    assert.equal(result.ok, false);
    assert.ok(result.distanceMeters > 100);
  });
});
