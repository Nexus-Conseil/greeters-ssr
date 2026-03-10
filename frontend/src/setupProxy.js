const { createProxyMiddleware } = require("http-proxy-middleware");
const net = require("net");
const { spawn } = require("child_process");

const target = "http://127.0.0.1:3100";

let nextGreetersProcess = null;
let nextGreetersBooting = false;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (value) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(400);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
    socket.connect(port, "127.0.0.1");
  });
}

async function ensureGreetersServer() {
  const alreadyRunning = await isPortOpen(3100);

  if (alreadyRunning || nextGreetersBooting) {
    return;
  }

  nextGreetersBooting = true;

  nextGreetersProcess = spawn(
    "yarn",
    ["dev", "--hostname", "127.0.0.1", "--port", "3100"],
    {
      cwd: "/app/greeters",
      env: process.env,
      stdio: "inherit",
    },
  );

  nextGreetersProcess.on("exit", () => {
    nextGreetersProcess = null;
    nextGreetersBooting = false;
  });

  const timeoutAt = Date.now() + 30000;
  while (Date.now() < timeoutAt) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortOpen(3100)) {
      nextGreetersBooting = false;
      return;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  nextGreetersBooting = false;
}

module.exports = function setupProxy(app) {
  void ensureGreetersServer();

  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/sockjs-node")) {
      next();
      return;
    }

    if (!(await isPortOpen(3100))) {
      await ensureGreetersServer();
    }

    next();
  });

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