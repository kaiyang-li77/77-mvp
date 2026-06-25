const { success, error } = require('./response');

describe('response utils', () => {
  test('success returns correct shape', () => {
    const res = success({ id: 1 }, 'OK');
    expect(res).toEqual({ success: true, data: { id: 1 }, message: 'OK' });
  });

  test('success with defaults', () => {
    const res = success();
    expect(res).toEqual({ success: true, data: null, message: '' });
  });

  test('error returns correct shape', () => {
    const res = error('Bad request', 400, { field: 'name' });
    expect(res).toEqual({ success: false, data: { field: 'name' }, message: 'Bad request', code: 400 });
  });

  test('error with defaults', () => {
    const res = error();
    expect(res).toEqual({ success: false, data: null, message: 'Internal error', code: 500 });
  });
});
