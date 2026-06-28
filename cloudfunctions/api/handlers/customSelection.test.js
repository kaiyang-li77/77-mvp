const { handle } = require('./customSelection');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('./config', () => ({
  handle: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const configHandler = require('./config');
const response = require('../utils/response');

describe('customSelection handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /custom-selection returns selection', async () => {
    const selection = { id: 1, user_id: 1, garment_code: 'suit', calculated_price: 3500 };
    query.mockResolvedValue({ rows: [selection] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM custom_selections WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [1]
    );
    expect(response.success).toHaveBeenCalledWith(selection);
    expect(result).toEqual({ success: true, data: selection, message: '' });
  });

  test('GET /custom-selection returns null when no selection exists', async () => {
    query.mockResolvedValue({ rows: [] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(response.success).toHaveBeenCalledWith(null);
    expect(result).toEqual({ success: true, data: null, message: '' });
  });

  test('PUT /custom-selection creates new selection and calculates price', async () => {
    const config = {
      garments: [{ code: 'suit', base_price: 3000 }],
      fabrics: [{ code: 'wool', extra_price: 500 }],
      details: [{ code: 'monogram', extra_price: 200 }],
    };
    configHandler.handle.mockResolvedValue({ data: config });

    const newSelection = { id: 2, user_id: 1, garment_code: 'suit', fabric_code: 'wool', calculated_price: 3700 };
    query
      .mockResolvedValueOnce({ rows: [] }) // existing check
      .mockResolvedValueOnce({ rows: [newSelection] }); // insert

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: { garment_code: 'suit', fabric_code: 'wool', color_code: 'navy', fit: 'regular', detail_codes: ['monogram'] },
    };
    const result = await handle(event, {}, user);

    expect(configHandler.handle).toHaveBeenCalledWith(event, {}, user);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)'),
      [1, 'suit', 'wool', 'navy', 'regular', JSON.stringify(['monogram']), 3700]
    );
    expect(response.success).toHaveBeenCalledWith(newSelection);
    expect(result.success).toBe(true);
  });

  test('PUT /custom-selection updates existing selection', async () => {
    const config = {
      garments: [{ code: 'shirt', base_price: 800 }],
      fabrics: [{ code: 'cotton', extra_price: 0 }],
      details: [],
    };
    configHandler.handle.mockResolvedValue({ data: config });

    const existing = { id: 3 };
    const updated = { id: 3, user_id: 1, garment_code: 'shirt', calculated_price: 800 };
    query
      .mockResolvedValueOnce({ rows: [existing] }) // existing check
      .mockResolvedValueOnce({ rows: [updated] }); // update

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: { garment_code: 'shirt', fabric_code: 'cotton', color_code: 'white', fit: 'slim', detail_codes: [] },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('detail_codes = $5::jsonb'),
      [expect.any(String), expect.any(String), expect.any(String), expect.any(String), '[]', 800, 3]
    );
    expect(response.success).toHaveBeenCalledWith(updated);
    expect(result).toEqual({ success: true, data: updated, message: '' });
  });

  test('POST /custom-selection/price returns calculated price without saving', async () => {
    const config = {
      garments: [{ code: 'coat', base_price: 5000 }],
      fabrics: [{ code: 'cashmere', extra_price: 2000 }],
      details: [{ code: 'lining', extra_price: 300 }],
    };
    configHandler.handle.mockResolvedValue({ data: config });

    const user = { id: 1 };
    const event = {
      method: 'POST',
      path: '/custom-selection/price',
      body: { garment_code: 'coat', fabric_code: 'cashmere', detail_codes: ['lining'] },
    };
    const result = await handle(event, {}, user);

    expect(configHandler.handle).toHaveBeenCalledWith(event, {}, user);
    expect(query).not.toHaveBeenCalled();
    expect(response.success).toHaveBeenCalledWith({ price: 7300 });
    expect(result).toEqual({ success: true, data: { price: 7300 }, message: '' });
  });

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'DELETE' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
