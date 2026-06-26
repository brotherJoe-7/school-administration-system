// Simulated Redis Caching Layer for Dashboard Queries
// In a production environment, this would integrate with 'redis' or 'ioredis'

const cache = new Map();

/**
 * Middleware to cache API responses
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build a unique cache key based on tenant, path, and query params
    const tenantId = req.tenant_id || 'global';
    const key = `cache:${tenantId}:${req.originalUrl || req.url}`;
    
    const cachedResponse = cache.get(key);
    
    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    } else if (cachedResponse) {
      cache.delete(key);
    }

    // Intercept res.json to store the response in cache
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          expiry: Date.now() + (duration * 1000)
        });
      }
      return originalJson.call(res, body);
    };

    next();
  };
};

/**
 * Clear cache for a specific tenant or globally
 * @param {string} tenantId 
 */
const clearCache = (tenantId = null) => {
  if (!tenantId) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(`cache:${tenantId}:`)) {
        cache.delete(key);
      }
    }
  }
};

module.exports = {
  cacheMiddleware,
  clearCache
};
