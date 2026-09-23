// Vercel serverless entry: every /api/* request is rewritten here (see
// vercel.json) with the original sub-path in `__path`, then handed to the
// same middleware the Vite dev/preview server uses.
import { apiMiddleware } from "../server/api.js";

const api = apiMiddleware(process.env);

export default function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const route = url.searchParams.get("__path");
  if (route !== null) {
    url.searchParams.delete("__path");
    req.url = `/api/${route}${url.search}`;
  }
  return api(req, res, () => {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found." }));
  });
}
