const { handle } = require('./users');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const response = require('../utils/response');

describe('users handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /users/me returns user info', async () => {
    const user = { id: 1, name: 'Alice' };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);
    expect(response.success).toHaveBeenCalledWith(user);
    expect(result).toEqual({ success: true, data: user, message: '' });
  });

  test('POST /users/me/phone updates phone', async () => {
    const updatedUser = { id: 1, phone: '13800138000', phone_verified: true };
    query.mockResolvedValue({ rows: [updatedUser] });

    const user = { id: 1 };
    const event = { method: 'POST', path: '/users/me/phone', body: { phone: '13800138000' } };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'UPDATE users SET phone = $1, phone_verified = true, updated_at = now() WHERE id = $2 RETURNING *',
      ['13800138000', 1]
    );
    expect(response.success).toHaveBeenCalledWith(updatedUser);
    expect(result).toEqual({ success: true, data: updatedUser, message: '' });
  });

  test('POST /users/me/phone without phone returns 400', async () => {
    const user = { id: 1 };
    const event = { method: 'POST', path: '/users/me/phone', body: {} };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('手机号不能为空', 400);
    expect(result).toEqual({ success: false, message: '手机号不能为空', code: 400, data: undefined });
  });

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'DELETE' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
