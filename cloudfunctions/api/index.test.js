const { main } = require('./index');
const { getUser } = require('./middleware/auth');
const response = require('./utils/response');

jest.mock('wx-server-sdk', () => ({
  init: jest.fn(),
  DYNAMIC_CURRENT_ENV: 'test-env'
}));

jest.mock('./middleware/auth', () => ({
  getUser: jest.fn()
}));

jest.mock('./utils/response', () => ({
  success: jest.fn((data, message = '') => ({ success: true, data, message })),
  error: jest.fn((message, code, data) => ({ success: false, message, code, data }))
}));

jest.mock('./handlers/config', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { config: true } }))
}));

jest.mock('./handlers/users', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { user: true } }))
}));

jest.mock('./handlers/bodyProfile', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { bodyProfile: true } }))
}));

jest.mock('./handlers/stylePreference', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { stylePreference: true } }))
}));

jest.mock('./handlers/recommendations', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { recommendations: true } }))
}));

jest.mock('./handlers/customSelection', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { customSelection: true } }))
}));

jest.mock('./handlers/orders', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { orders: true } }))
}));

jest.mock('./handlers/advisorBookings', () => ({
  handle: jest.fn(() => Promise.resolve({ success: true, data: { advisorBookings: true } }))
}));

const configHandler = require('./handlers/config');
const usersHandler = require('./handlers/users');
const bodyProfileHandler = require('./handlers/bodyProfile');
const stylePreferenceHandler = require('./handlers/stylePreference');
const recommendationsHandler = require('./handlers/recommendations');
const customSelectionHandler = require('./handlers/customSelection');
const ordersHandler = require('./handlers/orders');
const advisorBookingsHandler = require('./handlers/advisorBookings');

describe('cloud function entry router', () => {
  const mockUser = { id: 1, openid: 'test-openid' };

  beforeEach(() => {
    jest.clearAllMocks();
    getUser.mockResolvedValue(mockUser);
  });

  test('routes GET /config to config handler', async () => {
    const event = { method: 'GET', path: '/config' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(getUser).toHaveBeenCalledWith(context);
    expect(configHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/config', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { config: true } });
  });

  test('routes GET /users/me to users handler', async () => {
    const event = { method: 'GET', path: '/users/me' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(usersHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/users/me', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { user: true } });
  });

  test('routes POST /users/me/phone to users handler', async () => {
    const event = { method: 'POST', path: '/users/me/phone', body: { phone: '13800138000' } };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(usersHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/users/me/phone', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { user: true } });
  });

  test('routes GET /body-profile to bodyProfile handler', async () => {
    const event = { method: 'GET', path: '/body-profile' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(bodyProfileHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/body-profile', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { bodyProfile: true } });
  });

  test('routes GET /style-preference to stylePreference handler', async () => {
    const event = { method: 'GET', path: '/style-preference' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(stylePreferenceHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/style-preference', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { stylePreference: true } });
  });

  test('routes GET /recommendations to recommendations handler', async () => {
    const event = { method: 'GET', path: '/recommendations' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(recommendationsHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/recommendations', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { recommendations: true } });
  });

  test('routes GET /custom-selection to customSelection handler', async () => {
    const event = { method: 'GET', path: '/custom-selection' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(customSelectionHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/custom-selection', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { customSelection: true } });
  });

  test('routes POST /custom-selection/price to customSelection handler', async () => {
    const event = { method: 'POST', path: '/custom-selection/price', body: { garment_code: 'shirt' } };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(customSelectionHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/custom-selection/price', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { customSelection: true } });
  });

  test('routes GET /orders to orders handler', async () => {
    const event = { method: 'GET', path: '/orders' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(ordersHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/orders', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { orders: true } });
  });

  test('routes GET /orders/123 to orders handler with pathParams', async () => {
    const event = { method: 'GET', path: '/orders/123' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(ordersHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/orders/123', pathParams: { id: 123 } }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { orders: true } });
  });

  test('routes POST /advisor-bookings to advisorBookings handler', async () => {
    const event = { method: 'POST', path: '/advisor-bookings', body: { order_id: 1 } };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(advisorBookingsHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/advisor-bookings', pathParams: {} }),
      context,
      mockUser
    );
    expect(result).toEqual({ success: true, data: { advisorBookings: true } });
  });

  test('defaults method to GET when not provided', async () => {
    const event = { path: '/config' };
    const context = { env: 'test-env' };

    await main(event, context);

    expect(configHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET' }),
      context,
      mockUser
    );
  });

  test('defaults path to / when not provided', async () => {
    const event = { method: 'GET' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(response.error).toHaveBeenCalledWith('Not found: GET /', 404);
    expect(result).toEqual({ success: false, message: 'Not found: GET /', code: 404, data: undefined });
  });

  test('returns 404 for unknown path', async () => {
    const event = { method: 'GET', path: '/unknown' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(response.error).toHaveBeenCalledWith('Not found: GET /unknown', 404);
    expect(result).toEqual({ success: false, message: 'Not found: GET /unknown', code: 404, data: undefined });
  });

  test('returns 404 for unknown path with numeric suffix', async () => {
    const event = { method: 'GET', path: '/unknown/123' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(response.error).toHaveBeenCalledWith('Not found: GET /unknown/123', 404);
    expect(result).toEqual({ success: false, message: 'Not found: GET /unknown/123', code: 404, data: undefined });
  });

  test('returns 500 on handler error', async () => {
    const error = new Error('Handler failed');
    configHandler.handle.mockRejectedValue(error);

    const event = { method: 'GET', path: '/config' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(response.error).toHaveBeenCalledWith('Handler failed', 500);
    expect(result).toEqual({ success: false, message: 'Handler failed', code: 500, data: undefined });
  });

  test('returns 500 on auth error', async () => {
    const error = new Error('Unauthorized');
    getUser.mockRejectedValue(error);

    const event = { method: 'GET', path: '/config' };
    const context = { env: 'test-env' };

    const result = await main(event, context);

    expect(response.error).toHaveBeenCalledWith('Unauthorized', 500);
    expect(result).toEqual({ success: false, message: 'Unauthorized', code: 500, data: undefined });
  });

  test('preserves original event properties in handler call', async () => {
    const event = { method: 'POST', path: '/orders', body: { garment_code: 'shirt' }, extra: 'data' };
    const context = { env: 'test-env' };

    await main(event, context);

    expect(ordersHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/orders',
        body: { garment_code: 'shirt' },
        extra: 'data',
        pathParams: {}
      }),
      context,
      mockUser
    );
  });

  test('parsePath extracts id for two-part paths like /orders/123', async () => {
    const event = { method: 'GET', path: '/orders/123' };
    const context = { env: 'test-env' };

    await main(event, context);

    const callArg = ordersHandler.handle.mock.calls[0][0];
    expect(callArg.pathParams).toEqual({ id: 123 });
    expect(callArg.basePath).toBeUndefined();
  });

  test('parsePath does not extract id for single-part paths like /config', async () => {
    const event = { method: 'GET', path: '/config' };
    const context = { env: 'test-env' };

    await main(event, context);

    const callArg = configHandler.handle.mock.calls[0][0];
    expect(callArg.pathParams).toEqual({});
  });

  test('uppercases method before routing', async () => {
    const event = { method: 'get', path: '/config' };
    const context = { env: 'test-env' };

    await main(event, context);

    const callArg = configHandler.handle.mock.calls[0][0];
    expect(callArg.method).toBe('GET');
  });
});
