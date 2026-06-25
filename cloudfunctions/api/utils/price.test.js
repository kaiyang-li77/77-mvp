const { calculatePrice } = require('./price');

describe('calculatePrice', () => {
  const config = {
    garments: [
      { code: 'shirt', base_price: 10000 },
      { code: 'suit', base_price: 50000 },
    ],
    fabrics: [
      { code: 'cotton', extra_price: 5000 },
      { code: 'silk', extra_price: 15000 },
    ],
    details: [
      { code: 'monogram', extra_price: 2000 },
      { code: 'rush', extra_price: 3000 },
    ],
  };

  test('calculates base price only', () => {
    expect(calculatePrice('shirt', null, [], config)).toBe(10000);
  });

  test('calculates base + fabric', () => {
    expect(calculatePrice('shirt', 'cotton', [], config)).toBe(15000);
  });

  test('calculates base + fabric + details', () => {
    expect(calculatePrice('suit', 'silk', ['monogram', 'rush'], config)).toBe(70000);
  });

  test('returns 0 for unknown garment', () => {
    expect(calculatePrice('unknown', 'cotton', [], config)).toBe(5000);
  });

  test('returns 0 for unknown fabric', () => {
    expect(calculatePrice('shirt', 'unknown', [], config)).toBe(10000);
  });

  test('ignores unknown detail codes', () => {
    expect(calculatePrice('shirt', null, ['unknown'], config)).toBe(10000);
  });

  test('handles null detailCodes', () => {
    expect(calculatePrice('shirt', null, null, config)).toBe(10000);
  });

  test('handles empty config', () => {
    expect(calculatePrice('shirt', 'cotton', ['monogram'], {})).toBe(0);
  });
});
