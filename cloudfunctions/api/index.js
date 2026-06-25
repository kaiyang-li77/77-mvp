const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { getUser } = require('./middleware/auth');
const response = require('./utils/response');

const handlers = {
  '/config': require('./handlers/config'),
  '/users/me': require('./handlers/users'),
  '/users/me/phone': require('./handlers/users'),
  '/body-profile': require('./handlers/bodyProfile'),
  '/style-preference': require('./handlers/stylePreference'),
  '/recommendations': require('./handlers/recommendations'),
  '/custom-selection': require('./handlers/customSelection'),
  '/custom-selection/price': require('./handlers/customSelection'),
  '/orders': require('./handlers/orders'),
  '/advisor-bookings': require('./handlers/advisorBookings')
};

function parsePath(rawPath) {
  const path = rawPath || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
    return {
      basePath: '/' + parts.slice(0, -1).join('/'),
      pathParams: { id: parseInt(parts[parts.length - 1], 10) }
    };
  }
  return { basePath: path, pathParams: {} };
}

exports.main = async (event, context) => {
  try {
    const method = (event.method || 'GET').toUpperCase();
    const path = event.path || '/';
    const { basePath, pathParams } = parsePath(path);

    const handler = handlers[basePath];
    if (!handler) {
      return response.error(`Not found: ${method} ${path}`, 404);
    }

    const user = await getUser(context);
    return await handler.handle({ ...event, method, path, pathParams }, context, user);
  } catch (err) {
    console.error(err);
    return response.error(err.message || 'Internal error', 500);
  }
};
