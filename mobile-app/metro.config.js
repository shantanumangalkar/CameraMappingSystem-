const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

// Enhance Metro server middleware to proxy /api requests to Spring Boot backend (port 8088)
// This completely resolves browser CORS restrictions when previewing on laptop web browser.
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        const clientOrigin = req.headers.origin || 'http://localhost:8081';

        // Preflight CORS response
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': clientOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '3600',
          });
          res.end();
          return;
        }

        // Prepare backend headers: remove browser origin/referer so Spring Boot treats as direct local request
        const forwardHeaders = { ...req.headers };
        forwardHeaders.host = 'localhost:8088';
        delete forwardHeaders.origin;
        delete forwardHeaders.referer;

        const options = {
          hostname: 'localhost',
          port: 8088,
          path: req.url,
          method: req.method,
          headers: forwardHeaders,
        };

        const proxyReq = http.request(options, (proxyRes) => {
          const responseHeaders = { ...proxyRes.headers };
          responseHeaders['Access-Control-Allow-Origin'] = clientOrigin;
          responseHeaders['Access-Control-Allow-Credentials'] = 'true';

          res.writeHead(proxyRes.statusCode, responseHeaders);
          proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', (err) => {
          console.error('Metro API proxy error:', err.message);
          res.writeHead(502, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': clientOrigin,
          });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Backend service unreachable on port 8088', 
            details: err.message 
          }));
        });

        req.pipe(proxyReq, { end: true });
        return;
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
