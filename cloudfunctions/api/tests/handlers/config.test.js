const { handle } = require('../../handlers/config');
const { query } = require('../../config/db');
const response = require('../../utils/response');

jest.mock('../../config/db');
jest.mock('../../utils/response', () => ({
  success: jest.fn((data) => ({ success: true, data }))
}));

describe('config handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all config tables data', async () => {
    query.mockImplementation((sql) => {
      const table = sql.match(/FROM\s+(\w+)/)[1];
      return Promise.resolve({ rows: [{ id: 1, name: table }] });
    });

    const result = await handle({}, {}, {});

    expect(query).toHaveBeenCalledTimes(6);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('garments'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('fabrics'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('details'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('colors'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('styles'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('scenes'));

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('garments');
    expect(result.data).toHaveProperty('fabrics');
    expect(result.data).toHaveProperty('details');
    expect(result.data).toHaveProperty('colors');
    expect(result.data).toHaveProperty('styles');
    expect(result.data).toHaveProperty('scenes');
  });

  it('filters by is_active and orders correctly', async () => {
    query.mockResolvedValue({ rows: [] });

    await handle({}, {}, {});

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE is_active = true')
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY display_order, id')
    );
  });
});
