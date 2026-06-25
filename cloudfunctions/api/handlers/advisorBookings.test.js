const { handle } = require('./advisorBookings');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data })),
}));

const { query } = require('../config/db');
const response = require('../utils/response');

describe('advisorBookings handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /advisor-bookings creates booking with all fields', async () => {
    const booking = { id: 1, user_id: 1, order_id: 10, booking_type: 'offline_fitting', status: 'pending', booking_date: '2024-02-01', remark: 'Please call before arrival' };
    query.mockResolvedValue({ rows: [booking] });

    const user = { id: 1 };
    const event = {
      method: 'POST',
      body: { order_id: 10, booking_date: '2024-02-01', remark: 'Please call before arrival' },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO advisor_bookings'),
      [1, 10, 'offline_fitting', 'pending', '2024-02-01', 'Please call before arrival']
    );
    expect(response.success).toHaveBeenCalledWith(booking);
    expect(result).toEqual({ success: true, data: booking, message: '' });
  });

  test('POST /advisor-bookings defaults optional fields', async () => {
    const booking = { id: 2, user_id: 1, order_id: null, booking_type: 'offline_fitting', status: 'pending', booking_date: null, remark: '' };
    query.mockResolvedValue({ rows: [booking] });

    const user = { id: 1 };
    const event = {
      method: 'POST',
      body: {},
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO advisor_bookings'),
      [1, null, 'offline_fitting', 'pending', null, '']
    );
    expect(response.success).toHaveBeenCalledWith(booking);
    expect(result.success).toBe(true);
  });

  test('unsupported method returns 405', async () => {
    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Method not allowed', 405);
    expect(result).toEqual({ success: false, message: 'Method not allowed', code: 405, data: undefined });
  });
});
