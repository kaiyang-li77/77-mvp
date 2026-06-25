const { handle } = require('./recommendations');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const response = require('../utils/response');

describe('recommendations handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /recommendations returns active recommendations with items', async () => {
    const recs = [
      { id: 1, style_code: 'classic', match_score: 95 },
      { id: 2, style_code: 'modern', match_score: 80 },
    ];
    const items1 = [
      { id: 101, recommendation_id: 1, garment_name: 'Suit', fabric_name: 'Wool', color_name: 'Navy', hex_value: '#000080' },
    ];
    const items2 = [
      { id: 102, recommendation_id: 2, garment_name: 'Shirt', fabric_name: 'Cotton', color_name: 'White', hex_value: '#ffffff' },
    ];

    query
      .mockResolvedValueOnce({ rows: recs })
      .mockResolvedValueOnce({ rows: items1 })
      .mockResolvedValueOnce({ rows: items2 });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM recommendations r')
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM recommendation_items ri'),
      [1]
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM recommendation_items ri'),
      [2]
    );
    expect(response.success).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, items: items1 }),
        expect.objectContaining({ id: 2, items: items2 }),
      ])
    );
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].items).toEqual(items1);
    expect(result.data[1].items).toEqual(items2);
  });

  test('GET /recommendations returns empty array when no recommendations', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(1);
    expect(response.success).toHaveBeenCalledWith([]);
    expect(result).toEqual({ success: true, data: [], message: '' });
  });
});
