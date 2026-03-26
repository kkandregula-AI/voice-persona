/**
 * Production server for the Expo web PWA.
 * Serves the static output of `expo export --platform web` from dist/.
 * Implements SPA fallback: any unknown path returns index.html.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST_ROOT = path.resolve(__dirname, "..", "dist");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
const port = parseInt(process.env.PORT || "3000", 10);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};

function serveFile(filePath, res, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  // Cache immutable hashed assets forever, everything else no-cache
  const isHashed = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i.test(filePath);
  const cacheControl = isHashed
    ? "public, max-age=31536000, immutable"
    : "no-cache, no-store, must-revalidate";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(statusCode, {
      "content-type": contentType,
      "cache-control": cacheControl,
    });
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
}

function serveIndex(res) {
  const indexPath = path.join(DIST_ROOT, "index.html");
  if (!fs.existsSync(indexPath)) {
    res.writeHead(503, { "content-type": "text/plain" });
    res.end(
      "Build not found. The app may still be building. Try again in a moment."
    );
    return;
  }
  serveFile(indexPath, res);
}

if (!fs.existsSync(DIST_ROOT)) {
  console.warn(
    `Warning: dist/ not found at ${DIST_ROOT}. Run "pnpm --filter @workspace/mobile run build" first.`
  );
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Strip base path prefix
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Prevent path traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(DIST_ROOT, safePath);

  if (!filePath.startsWith(DIST_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve existing files directly
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
    return;
  }

  // Try index.html in a directory
  const dirIndex = path.join(filePath, "index.html");
  if (fs.existsSync(dirIndex) && fs.statSync(dirIndex).isFile()) {
    serveFile(dirIndex, res);
    return;
  }

  // SPA fallback — serve root index.html for client-side routing
  serveIndex(res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Voice Persona AI web PWA serving on port ${port}`);
  console.log(`Serving from: ${DIST_ROOT}`);
});
