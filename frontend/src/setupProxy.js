const { createProxyMiddleware } = require("http-proxy-middleware");

const target = "http://127.0.0.1:3100";

module.exports = function setupProxy(app) {
  app.use(
    createProxyMiddleware({
      pathFilter: (pathname) => !pathname.startsWith("/api") && !pathname.startsWith("/sockjs-node"),
      target,
      changeOrigin: true,
      ws: true,
      logLevel: "warn",
      xfwd: true,
    }),
  );
};