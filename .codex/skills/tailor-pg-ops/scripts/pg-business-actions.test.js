const assert = require('assert');
const test = require('node:test');

const actions = require('./pg-business-actions');

test('sanitizes dates without turning them into empty objects', () => {
  const value = actions.sanitize({ created_at: new Date('2026-06-26T09:27:36.000Z') });

  assert.deepStrictEqual(value, { created_at: '2026-06-26T09:27:36.000Z' });
});

test('sanitize keeps private fields by default and masks on request', () => {
  const value = {
    phone: '13800138000',
    openid: 'oTCgn7abcdef3YHk',
    avatar_url: 'https://example.com/avatar.png'
  };

  assert.deepStrictEqual(actions.sanitize(value), value);
  assert.deepStrictEqual(actions.sanitize(value, true), {
    phone: '138****8000',
    openid: 'oTCgn7...3YHk',
    avatar_url: '[redacted]'
  });
});

test('recent-orders returns full backend customer and order summaries', async () => {
  const client = {
    async query(sql, values) {
      assert.match(sql, /ORDER BY o\.created_at DESC/);
      assert.deepStrictEqual(values, [20]);
      return {
        rows: [{
          id: 6,
          order_no: 'O202606269nr2169001',
          status: 'pending',
          total_price: 474000,
          deposit: 146940,
          created_at: new Date('2026-06-26T09:27:36.000Z'),
          user_id: 2,
          nickname: null,
          phone: '13800138000',
          openid: 'oTCgn7abcdef3YHk'
        }]
      };
    }
  };

  const rows = await actions.recentOrders(client, {});

  assert.deepStrictEqual(rows, [{
    id: 6,
    order_no: 'O202606269nr2169001',
    status: 'pending',
    total_price: 474000,
    total_price_yuan: '4740.00',
    deposit: 146940,
    deposit_yuan: '1469.40',
    created_at: '2026-06-26T09:27:36.000Z',
    user_id: 2,
    nickname: null,
    phone: '13800138000',
    openid: 'oTCgn7abcdef3YHk',
    customer_summary: '用户#2 / 手机号 13800138000 / openid oTCgn7abcdef3YHk',
    order_summary: '用户#2 / 手机号 13800138000 / openid oTCgn7abcdef3YHk 下单 O202606269nr2169001，状态 pending，总价 ¥4740.00，定金 ¥1469.40'
  }]);
});
