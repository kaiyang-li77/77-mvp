function success(data = null, message = '') {
  return { success: true, data, message };
}

function error(message = 'Internal error', code = 500, data = null) {
  return { success: false, data, message, code };
}

module.exports = { success, error };
