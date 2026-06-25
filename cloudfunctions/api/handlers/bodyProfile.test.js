const { handle } = require('./bodyProfile');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const response = require('../utils/response');

describe('bodyProfile handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /body-profile returns default profile', async () => {
    const profile = { id: 1, user_id: 1, height: 175, weight: 70, is_default: true };
    query.mockResolvedValue({ rows: [profile] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM body_profiles WHERE user_id = $1 AND is_default = true ORDER BY id DESC LIMIT 1',
      [1]
    );
    expect(response.success).toHaveBeenCalledWith(profile);
    expect(result).toEqual({ success: true, data: profile, message: '' });
  });

  test('GET /body-profile returns null when no profile exists', async () => {
    query.mockResolvedValue({ rows: [] });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(response.success).toHaveBeenCalledWith(null);
    expect(result).toEqual({ success: true, data: null, message: '' });
  });

  test('PUT /body-profile creates new profile when none exists', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // existing check
      .mockResolvedValueOnce({ rows: [{ id: 2, user_id: 1, height: 180, weight: 75, is_default: true }] }); // insert

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: {
        height: 180,
        weight: 75,
        shoulder: 45,
        chest: 100,
        waist: 80,
        hip: 95,
        sleeve: 60,
        pants_length: 105,
        body_type: 'athletic',
      },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO body_profiles'),
      [1, 180, 75, 45, 100, 80, 95, 60, 105, 'athletic']
    );
    expect(response.success).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, height: 180, weight: 75 })
    );
    expect(result.success).toBe(true);
  });

  test('PUT /body-profile updates existing profile', async () => {
    const existingProfile = { id: 3 };
    const updatedProfile = { id: 3, user_id: 1, height: 170, weight: 65, is_default: true };
    query
      .mockResolvedValueOnce({ rows: [existingProfile] }) // existing check
      .mockResolvedValueOnce({ rows: [updatedProfile] }); // update

    const user = { id: 1 };
    const event = {
      method: 'PUT',
      body: {
        height: 170,
        weight: 65,
        shoulder: 42,
        chest: 95,
        waist: 78,
        hip: 92,
        sleeve: 58,
        pants_length: 100,
        body_type: 'slim',
      },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(2);
    expect(response.success).toHaveBeenCalledWith(updatedProfile);
    expect(result).toEqual({ success: true, data: updatedProfile, message: '' });
  });

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'DELETE' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
