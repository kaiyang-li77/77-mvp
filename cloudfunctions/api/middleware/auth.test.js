const { getUser } = require('./auth');
const { query } = require('../config/db');

// Mock wx-server-sdk
jest.mock('wx-server-sdk', () => ({
  getWXContext: jest.fn()
}));

const cloud = require('wx-server-sdk');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws when OPENID is missing', async () => {
    cloud.getWXContext.mockReturnValue({});
    await expect(getUser({ env: 'test' })).rejects.toThrow('Unauthorized: missing OPENID');
  });

  test('returns existing user', async () => {
    cloud.getWXContext.mockReturnValue({ OPENID: 'openid_123' });
    const mockUser = { id: 1, openid: 'openid_123', phone: null, status: 'active', created_at: new Date(), updated_at: new Date() };
    query.mockResolvedValue({ rows: [mockUser] });

    const user = await getUser({ env: 'test' });
    expect(user).toEqual(mockUser);
    expect(query).toHaveBeenCalledWith(
      'SELECT id, openid, phone, status, created_at, updated_at FROM users WHERE openid = $1',
      ['openid_123']
    );
  });

  test('creates new user when not found', async () => {
    cloud.getWXContext.mockReturnValue({ OPENID: 'new_openid' });
    const mockUser = { id: 2, openid: 'new_openid', phone: null, status: 'active', created_at: new Date(), updated_at: new Date() };
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [mockUser] });

    const user = await getUser({ env: 'test' });
    expect(user).toEqual(mockUser);
    expect(query).toHaveBeenCalledWith(
      'INSERT INTO users (openid, status) VALUES ($1, $2) RETURNING id, openid, phone, status, created_at, updated_at',
      ['new_openid', 'active']
    );
  });
});
