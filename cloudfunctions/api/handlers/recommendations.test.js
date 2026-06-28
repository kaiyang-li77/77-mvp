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
    const rows = [
      {
        id: 1, code: 'rec-1', name: 'Classic Suit', style_code: 'classic', match_score: 95,
        base_price: 398000, scene_description: 'Office', reason: 'Good fit', is_active: true,
        style_name: 'Classic',
        item_id: 101, garment_code: 'suit', fabric_code: 'wool', color_code: 'navy',
        garment_name: 'Suit', fabric_name: 'Wool', color_name: 'Navy', hex_value: '#000080',
        display_order: 1,
      },
      {
        id: 2, code: 'rec-2', name: 'Modern Shirt', style_code: 'modern', match_score: 80,
        base_price: 128000, scene_description: 'Daily', reason: 'Easy care', is_active: true,
        style_name: 'Modern',
        item_id: 102, garment_code: 'shirt', fabric_code: 'cotton', color_code: 'white',
        garment_name: 'Shirt', fabric_name: 'Cotton', color_name: 'White', hex_value: '#ffffff',
        display_order: 1,
      },
    ];

    query.mockResolvedValueOnce({ rows });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(1);
    expect(response.success).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          code: 'rec-1',
          name: 'Classic Suit',
          match: 95,
          reason: 'Good fit',
          items: expect.arrayContaining([expect.objectContaining({ id: 101 })])
        }),
        expect.objectContaining({ id: 2, items: expect.arrayContaining([expect.objectContaining({ id: 102 })]) }),
      ])
    );
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].items).toHaveLength(1);
    expect(result.data[1].items).toHaveLength(1);
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

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'POST' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
