import fs from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider, verifyMessage } from "ethers";
import { createLogReader } from './log-reader.js';
const deployment = JSON.parse(
  fs.readFileSync(
    new URL(
      "../broadcast/DeployFreelanceEscrow.s.sol/11155111/run-latest.json",
      import.meta.url,
    ),
  ),
);
const artifact = JSON.parse(
  fs.readFileSync(new URL("../frontend/lib/abi.json", import.meta.url)),
);
export function configuration(env) {
  return {
    address:
      env.VITE_CONTRACT_ADDRESS ||
      env.CONTRACT_ADDRESS ||
      deployment.transactions.find((t) => t.contractName === "FreelanceEscrow")
        .contractAddress,
    chainId: Number(env.VITE_CHAIN_ID || 11155111),
    explorer: env.VITE_EXPLORER_URL || "https://sepolia.etherscan.io",
    deploymentBlock: Number(
      env.VITE_DEPLOYMENT_BLOCK || deployment.receipts[0].blockNumber,
    ),
  };
}
export function apiMiddleware(env) {
  const config = configuration(env);
  const provider = env.SEPOLIA_RPC_URL
    ? new JsonRpcProvider(env.SEPOLIA_RPC_URL)
    : null;
  const contract = provider && new Contract(config.address, artifact, provider);
  const readLogs = provider && createLogReader(provider, config.address);
  const directory = path.resolve(
    ".data",
    `${config.chainId}-${config.address.toLowerCase()}`,
  );
  const allowed = new Set([
    "eth_chainId",
    "eth_blockNumber",
    "eth_call",
    "eth_getCode",
    "eth_getBalance",
    "eth_getLogs",
    "eth_getBlockByNumber",
    "eth_getTransactionReceipt",
    "eth_getTransactionByHash",
  ]);
  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    const send = (code, data) => {
      res.writeHead(code, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return send(403, { error: "Origin not allowed." });
      if (url.pathname === "/api/config" && req.method === "GET")
        return send(200, { ...config, rpcAvailable: !!provider });
      let body;
      if (req.method === "POST") {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 100000)
            return send(413, { error: "Request too large." });
        }
        body = JSON.parse(raw);
      }
      if (url.pathname === "/api/rpc" && req.method === "POST") {
        if (!provider)
          return send(503, { error: "Sepolia RPC is not configured." });
        const calls = Array.isArray(body) ? body : [body];
        if (calls.length > 30 || calls.some((c) => !allowed.has(c.method)))
          return send(400, {
            error: "Only supported contract reads are allowed.",
          });
        const responses = await Promise.all(
          calls.map(async (c) => {
            try {
              return {
                jsonrpc: "2.0",
                id: c.id,
                result: c.method === 'eth_getLogs' ? await readLogs(c.params?.[0]) : await provider.send(c.method, c.params || []),
              };
            } catch {
              return {
                jsonrpc: "2.0",
                id: c.id,
                error: {
                  code: -32000,
                  message: "Sepolia read failed. Please retry.",
                },
              };
            }
          }),
        );
        return send(200, Array.isArray(body) ? responses : responses[0]);
      }
      const match = url.pathname.match(/^\/api\/metadata\/(\d+)$/);
      if (match) {
        const file = path.join(directory, `${match[1]}.json`);
        if (req.method === "GET")
          return send(
            200,
            fs.existsSync(file)
              ? JSON.parse(fs.readFileSync(file, "utf8"))
              : null,
          );
        if (req.method === "POST" && contract) {
          const { metadata, signature } = body;
          if (
            !metadata ||
            typeof metadata.title !== "string" ||
            metadata.title.length > 100 ||
            typeof metadata.description !== "string" ||
            metadata.description.length > 10000 ||
            (metadata.skills !== undefined &&
              (!Array.isArray(metadata.skills) ||
                metadata.skills.length > 30 ||
                metadata.skills.some(
                  (s) => typeof s !== "string" || s.length > 100,
                ))) ||
            (metadata.requirements !== undefined &&
              (typeof metadata.requirements !== "string" ||
                metadata.requirements.length > 4000)) ||
            (metadata.attachments !== undefined &&
              (!Array.isArray(metadata.attachments) ||
                metadata.attachments.length > 20 ||
                metadata.attachments.some(
                  (s) => typeof s !== "string" || s.length > 3000,
                )))
          )
            return send(400, { error: "Invalid project details." });
          const job = await contract.getJob(match[1]);
          const message = `Escrowly project details\n${config.chainId}:${config.address.toLowerCase()}:${match[1]}\n${JSON.stringify(metadata)}`;
          if (
            verifyMessage(message, signature).toLowerCase() !==
            job.client.toLowerCase()
          )
            return send(403, {
              error: "Only the project client can publish details.",
            });
          fs.mkdirSync(directory, { recursive: true });
          fs.writeFileSync(file, JSON.stringify(metadata));
          return send(200, { ok: true });
        }
      }
      return send(404, { error: "Not found." });
    } catch {
      return send(400, {
        error:
          "Request could not be completed. Check your connection and try again.",
      });
    }
  };
}
