const { handle } = require('./stylePreference');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const response = require('../utils/response');

describe('stylePreference handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /style-preference returns preference', async () => {
    const preference = { id: 1, user_id: 1, preferred_styles: ['classic'], fit: 'regular' };
    query.mockResolvedValue({ rows: [preference] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM style_preferences WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [1]
    );
    expect(response.success).toHaveBeenCalledWith(preference);
    expect(result).toEqual({ success: true, data: preference, message: '' });
  });

  test('GET /style-preference returns null when no preference exists', async () => {
    query.mockResolvedValue({ rows: [] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(response.success).toHaveBeenCalledWith(null);
    expect(result).toEqual({ success: true, data: null, message: '' });
  });

  test('PUT /style-preference creates new preference when none exists', async () => {
    const newPreference = { id: 2, user_id: 1, preferred_styles: ['modern'], preferred_colors: ['navy'], fit: 'slim', preferred_scenes: ['business'] };
    query
      .mockResolvedValueOnce({ rows: [] }) // existing check
      .mockResolvedValueOnce({ rows: [newPreference] }); // insert

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: { preferred_styles: ['modern'], preferred_colors: ['navy'], fit: 'slim', preferred_scenes: ['business'] },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(2);
    expect(response.success).toHaveBeenCalledWith(newPreference);
    expect(result.success).toBe(true);
  });

  test('PUT /style-preference updates existing preference', async () => {
    const existing = { id: 3 };
    const updated = { id: 3, user_id: 1, preferred_styles: ['casual'], preferred_colors: ['white'], fit: 'loose', preferred_scenes: ['weekend'] };
    query
      .mockResolvedValueOnce({ rows: [existing] }) // existing check
      .mockResolvedValueOnce({ rows: [updated] }); // update

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: { preferred_styles: ['casual'], preferred_colors: ['white'], fit: 'loose', preferred_scenes: ['weekend'] },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('preferred_styles = $1::jsonb'),
      [
        JSON.stringify(['casual']),
        JSON.stringify(['white']),
        'loose',
        JSON.stringify(['weekend']),
        3
      ]
    );
    expect(response.success).toHaveBeenCalledWith(updated);
    expect(result).toEqual({ success: true, data: updated, message: '' });
  });

  test('PUT /style-preference defaults arrays to empty when missing', async () => {
    const newPreference = { id: 4, user_id: 1, preferred_styles: [], preferred_colors: [], fit: null, preferred_scenes: [] };
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [newPreference] });

    const user = { id: 1 };
    const event = { method: 'PUT', body: { fit: null } };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::jsonb)'),
      [1, '[]', '[]', null, '[]']
    );
    expect(result.success).toBe(true);
  });

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'DELETE' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
