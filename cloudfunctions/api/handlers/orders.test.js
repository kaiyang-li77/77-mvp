const { handle } = require('./orders');

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

describe('orders handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /orders returns order list', async () => {
    const orders = [
      { id: 1, user_id: 1, order_no: 'O202401010001', total_price: 3500 },
      { id: 2, user_id: 1, order_no: 'O202401020002', total_price: 2800 },
    ];
    query.mockResolvedValue({ rows: orders });

    const user = { id: 1 };
    const event = { method: 'GET' };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [1]
    );
    expect(response.success).toHaveBeenCalledWith(orders);
    expect(result).toEqual({ success: true, data: orders, message: '' });
  });

  test('GET /orders/:id returns single order', async () => {
    const order = { id: 1, user_id: 1, order_no: 'O202401010001', total_price: 3500 };
    query.mockResolvedValue({ rows: [order] });

    const user = { id: 1 };
    const event = { method: 'GET', pathParams: { id: '1' } };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      ['1', 1]
    );
    expect(response.success).toHaveBeenCalledWith(order);
    expect(result).toEqual({ success: true, data: order, message: '' });
  });

  test('GET /orders/:id returns 400 for non-numeric id', async () => {
    const user = { id: 1 };
    const event = { method: 'GET', pathParams: { id: 'abc' } };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('Invalid order ID', 400);
    expect(result).toEqual({ success: false, message: 'Invalid order ID', code: 400, data: undefined });
  });

  test('GET /orders/:id returns 404 when not found', async () => {
    query.mockResolvedValue({ rows: [] });

    const user = { id: 1 };
    const event = { method: 'GET', pathParams: { id: '999' } };
    const result = await handle(event, {}, user);

    expect(response.error).toHaveBeenCalledWith('订单不存在', 404);
    expect(result).toEqual({ success: false, message: '订单不存在', code: 404, data: undefined });
  });

  test('POST /orders creates order with calculated price and snapshot', async () => {
    const config = {
      garments: [{ code: 'suit', base_price: 3000 }],
      fabrics: [{ code: 'wool', extra_price: 500 }],
      details: [],
    };
    configHandler.handle.mockResolvedValue({ data: config });

    const profile = { id: 10, user_id: 1, height: 175 };
    const selection = { id: 20, user_id: 1, garment_code: 'suit' };
    const newOrder = { id: 100, user_id: 1, order_no: 'O202401010001', total_price: 3500, deposit: 1085, status: 'pending' };

    query
      .mockResolvedValueOnce({ rows: [profile] })   // profile query
      .mockResolvedValueOnce({ rows: [selection] }) // insert custom_selections
      .mockResolvedValueOnce({ rows: [newOrder] });  // insert order

    const user = { id: 1 };
    const event = {
      method: 'POST',
      body: { garment_code: 'suit', fabric_code: 'wool', color_code: 'navy', fit: 'regular', detail_codes: [] },
    };
    const result = await handle(event, {}, user);

    expect(configHandler.handle).toHaveBeenCalledWith(event, {}, user);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO custom_selections'),
      [1, 'suit', 'wool', 'navy', 'regular', []]
    );
    expect(response.success).toHaveBeenCalledWith(newOrder);
    expect(result.success).toBe(true);
  });

  test('POST /orders handles missing profile gracefully', async () => {
    const config = {
      garments: [{ code: 'shirt', base_price: 800 }],
      fabrics: [{ code: 'cotton', extra_price: 0 }],
      details: [],
    };
    configHandler.handle.mockResolvedValue({ data: config });

    const selection = { id: 21, user_id: 1, garment_code: 'shirt' };
    const newOrder = { id: 101, user_id: 1, total_price: 800, deposit: 248, status: 'pending' };

    query
      .mockResolvedValueOnce({ rows: [] })         // no profile
      .mockResolvedValueOnce({ rows: [selection] })  // insert custom_selections
      .mockResolvedValueOnce({ rows: [newOrder] });  // insert order

    const user = { id: 1 };
    const event = {
      method: 'POST',
      body: { garment_code: 'shirt', fabric_code: 'cotton', color_code: 'white', fit: 'slim' },
    };
    const result = await handle(event, {}, user);

    expect(query).toHaveBeenCalledTimes(3);
    expect(response.success).toHaveBeenCalledWith(newOrder);
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
