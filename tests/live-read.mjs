import { Contract, JsonRpcProvider } from "ethers";
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import { loadEnv } from "vite";
const base = process.argv[2] || "http://127.0.0.1:5174";
const config = await (await fetch(`${base}/api/config`)).json();
const provider = new JsonRpcProvider(`${base}/api/rpc`, config.chainId, {
  staticNetwork: true,
});
const abi = JSON.parse(fs.readFileSync("frontend/lib/abi.json", "utf8"));
const contract = new Contract(config.address, abi, provider);
const count = await contract.jobCounter();
console.log(
  `Sepolia read succeeded: ${count} jobs on the configured deployment.`,
);
const env = loadEnv("production", process.cwd(), "");
const bundle = fs
  .readdirSync("dist/assets")
  .filter((f) => f.endsWith(".js"))
  .map((f) => fs.readFileSync(`dist/assets/${f}`, "utf8"))
  .join("\n");
for (const key of ["PRIVATE_KEY", "APIKEY", "SEPOLIA_RPC_URL"])
  if (env[key] && bundle.includes(env[key]))
    throw new Error(`Private configuration leaked: ${key}`);
console.log(
  "Production JavaScript contains no private key, API key, or upstream RPC URL.",
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/explore",
    "/create",
    "/dashboard",
    "/transactions",
    "/help",
  ]) {
    console.log(`Checking ${route}`);
    await page.goto(base + route);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText("Something went wrong.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Couldn’t read the contract", { exact: true }),
    ).toHaveCount(0);
  }
  await page.goto(base + "/explore");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: ".verification/live-sepolia-explore.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  console.log(
    "Live Sepolia read-only browser smoke checks passed on six routes.",
  );
} finally {
  provider.destroy();
  await browser.close();
}
