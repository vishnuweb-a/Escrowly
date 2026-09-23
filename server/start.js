import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { apiMiddleware } from "./api.js";
const api = apiMiddleware({
  ...loadEnv("production", process.cwd(), ""),
  ...process.env,
});
const root = path.resolve("dist");
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
http
  .createServer((req, res) =>
    api(req, res, () => {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403);
        return res.end();
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
        file = path.join(root, "index.html");
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      fs.createReadStream(file).pipe(res);
    }),
  )
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log("Escrowly running at http://127.0.0.1:4173"),
  );
