import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { ContractFactory, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { createServer } from "vite";
const output = ".verification";
fs.mkdirSync(output, { recursive: true });
const anvil = spawn(
  "anvil",
  ["--silent", "--port", "18545", "--chain-id", "11155111"],
  { windowsHide: true, stdio: "ignore" },
);
let server, browser;
const provider = new JsonRpcProvider("http://127.0.0.1:18545", 11155111, {
  staticNetwork: true,
  cacheTimeout: -1,
});
const errors = [],
  checks = [];
try {
  for (let n = 0; n < 50; n++) {
    try {
      await provider.getBlockNumber();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const client = await provider.getSigner(0),
    freelancer = await provider.getSigner(1),
    outsider = await provider.getSigner(2);
  const accounts = [
    await client.getAddress(),
    await freelancer.getAddress(),
    await outsider.getAddress(),
  ];
  const artifact = JSON.parse(
    fs.readFileSync("out/FreelanceEscrow.sol/FreelanceEscrow.json", "utf8"),
  );
  const contract = await new ContractFactory(
    artifact.abi,
    artifact.bytecode.object,
    client,
  ).deploy();
  await contract.waitForDeployment();
  process.env.SEPOLIA_RPC_URL = "http://127.0.0.1:18545";
  process.env.VITE_CONTRACT_ADDRESS = await contract.getAddress();
  process.env.VITE_CHAIN_ID = "11155111";
  process.env.VITE_DEPLOYMENT_BLOCK = "1";
  server = await createServer({
    server: { port: 5180, strictPort: true, host: "127.0.0.1" },
  });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  let selected = accounts[0],
    wrong = false,
    reject = false;
  await context.exposeBinding("testWalletRPC", async (_, request) => {
    if (
      request.method === "eth_accounts" ||
      request.method === "eth_requestAccounts"
    )
      return [selected];
    if (request.method === "eth_chainId") return wrong ? "0x1" : "0xaa36a7";
    if (request.method === "wallet_switchEthereumChain") {
      wrong = false;
      return null;
    }
    if (request.method === "eth_sendTransaction" && reject) {
      reject = false;
      throw new Error("Wallet request rejected for test");
    }
    return provider.send(request.method, request.params || []);
  });
  await context.addInitScript(() => {
    const listeners = {};
    window.ethereum = {
      request: async (payload) => {
        const result = await window.testWalletRPC(payload);
        if (payload.method === "wallet_switchEthereumChain")
          (listeners.chainChanged || []).forEach((fn) => fn("0xaa36a7"));
        return result;
      },
      on: (name, fn) => {
        (listeners[name] ||= []).push(fn);
      },
      removeListener: (name, fn) => {
        listeners[name] = (listeners[name] || []).filter((f) => f !== fn);
      },
    };
    window.testWalletEvent = (name, value) =>
      (listeners[name] || []).forEach((fn) => fn(value));
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const go = async (route) => {
    await page.goto(`http://127.0.0.1:5180${route}`);
    await page.waitForLoadState("networkidle");
  };
  const shot = async (name) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  };
  const switchAccount = async (n) => {
    selected = accounts[n];
    await page.evaluate(
      (a) => window.testWalletEvent("accountsChanged", [a]),
      selected,
    );
  };
  const noOverflow = async (name) => {
    const measurements = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(
      measurements.scroll,
      `${name} horizontal overflow`,
    ).toBeLessThanOrEqual(measurements.width);
  };
  const confirmed = async () => {
    await expect(
      page.getByText("Transaction confirmed", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
  };
  await go("/");
  await shot("01-home-desktop");
  await noOverflow("home desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("01-home-mobile");
  await noOverflow("home mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/create");
  await page.getByLabel("Job Title").fill("Build React Analytics Dashboard");
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "Build a modern, responsive analytics dashboard with real-time data visualization for a Web3 platform. Clean UI, great UX, and reusable components.\n\nWe are looking for an experienced React developer to build an analytics dashboard for our Web3 platform. The dashboard will display key metrics such as transaction volume, user growth, and protocol activity.",
    );
  await page
    .getByLabel("Required Skills")
    .fill("React, TypeScript, Web3, Chart.js");
  await page.getByLabel("Budget (ETH)").fill("0.50");
  const deadline = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Deadline", { exact: true }).fill(deadline);
  await page
    .getByLabel("Additional Requirements")
    .fill(
      "Build a responsive dashboard based on provided designs.\nIntegrate live on-chain data.\nDeliver clean, well-documented code and setup instructions.",
    );
  await shot("04-create-desktop");
  await page.getByRole("button", { name: "Create Job", exact: true }).click();
  await expect(page).toHaveURL(/\/jobs\/1$/, { timeout: 20000 });
  await expect(
    page
      .getByRole("heading", {
        name: "Build React Analytics Dashboard",
        exact: true,
      })
      .first(),
  ).toBeVisible({ timeout: 20000 });
  await expect.poll(async () => (await contract.getJob(1)).status).toBe(0n);
  checks.push("Create job confirmed and signed metadata published");
  for (const [i, title, budget, skills] of [
    [
      0,
      "Solidity Smart Contract Audit",
      "1.20",
      ["Solidity", "Security", "DeFi", "Audit"],
    ],
    [1, "DeFi Landing Page Redesign", "0.35", ["UI/UX", "Figma", "Web3"]],
    [2, "Telegram Bot Integration", "0.30", ["Python", "Telegram", "Web3"]],
    [3, "Web3 App Frontend", "0.55", ["React", "Ethers.js", "Tailwind"]],
    [4, "Web3 Portfolio Website", "0.25", ["React", "Tailwind", "Portfolio"]],
  ]) {
    await (
      await contract.createJob(
        parseEther(budget),
        Math.floor(Date.now() / 1000) + 86400 * (7 + i),
      )
    ).wait();
    const metadata = {
      title,
      description:
        "Build a thoughtful, responsive experience with clear deliverables and smart-contract escrow.",
      skills,
      requirements: "Deliver source code and a working demo.",
      attachments: [],
    };
    const id = i + 2,
      address = (await contract.getAddress()).toLowerCase();
    const signature = await client.signMessage(
      `Escrowly project details\n11155111:${address}:${id}\n${JSON.stringify(metadata)}`,
    );
    const response = await fetch(`http://127.0.0.1:5180/api/metadata/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata, signature }),
    });
    expect(response.status).toBe(200);
  }
  await go("/explore");
  await expect(page.getByText("6 jobs found")).toBeVisible();
  await shot("02-explore-desktop");
  await page
    .getByRole("textbox", { name: "Search jobs", exact: true })
    .fill("Solidity");
  await expect(page.getByText("1 jobs found")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search jobs", exact: true })
    .fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("02-explore-mobile");
  await noOverflow("explore mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await switchAccount(1);
  await go("/jobs/1");
  await expect(page.getByRole("link", { name: "Apply for Job" })).toBeVisible();
  await shot("03-job-details");
  await go("/jobs/1/apply");
  await page.getByLabel("Proposed Price (ETH)").fill("0.40");
  await page.getByLabel("Estimated Duration (days)").fill("7");
  await page
    .getByLabel("Proposal", { exact: true })
    .fill(
      "I have extensive experience building data-rich dashboards with React and Web3. I will deliver a responsive dashboard with reusable components and clear setup instructions.",
    );
  await page
    .getByLabel("Proposal Reference / URI (optional)")
    .fill("https://github.com/example/project");
  await shot("05-apply");
  await page
    .getByRole("button", { name: "Submit Application", exact: true })
    .click();
  await expect(page).toHaveURL(/\/jobs\/1$/, { timeout: 20000 });
  await expect
    .poll(async () => await contract.getApplicationsCount(1))
    .toBe(1n);
  checks.push("Freelancer application confirmed");
  await switchAccount(0);
  await go("/jobs/1/applications");
  await page
    .getByRole("button", { name: "Select Freelancer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot("06-select-modal");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Select Freelancer", exact: true })
    .click();
  await confirmed();
  await expect.poll(async () => (await contract.getJob(1)).status).toBe(1n);
  await go("/jobs/1/fund");
  await shot("07-fund");
  await page.getByRole("button", { name: "Fund 0.40 ETH" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fund 0.40 ETH" })
    .click();
  await confirmed();
  await expect
    .poll(async () => (await contract.getJob(1)).escrowAmount)
    .toBe(parseEther(".4"));
  checks.push("Selection and exact escrow funding confirmed");
  await switchAccount(2);
  await go("/jobs/1/project");
  await expect(page.getByRole("button", { name: "Start Work" })).toHaveCount(0);
  checks.push("Unrelated wallet has no protected actions");
  await switchAccount(1);
  await go("/jobs/1/project");
  await page.getByRole("button", { name: "Start Work" }).click();
  await confirmed();
  await expect.poll(async () => (await contract.getJob(1)).status).toBe(3n);
  await shot("08-active-project");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("08-active-mobile");
  await noOverflow("active mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/jobs/1/submit");
  await page
    .getByLabel("Work URL / Submission URI")
    .fill("https://github.com/example/deliverable");
  await page
    .getByLabel("Submission Note")
    .fill(
      "The completed dashboard includes setup instructions, responsive layouts, and integrated analytics.",
    );
  await shot("11-submit-work");
  await page.getByRole("button", { name: "Submit Work", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit Work", exact: true })
    .click();
  await expect(page).toHaveURL(/\/jobs\/1\/project$/, { timeout: 20000 });
  await expect.poll(async () => (await contract.getJob(1)).status).toBe(4n);
  checks.push("Start and submit work confirmed");
  await switchAccount(0);
  await go("/jobs/1/review");
  await page.getByRole("button", { name: "Approve & Release" }).click();
  await shot("09-approve-modal");
  const before = await provider.getBalance(accounts[1]);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Approve & Release 0.40 ETH" })
    .click();
  await confirmed();
  await expect.poll(async () => (await contract.getJob(1)).status).toBe(5n);
  expect((await provider.getBalance(accounts[1])) - before).toBe(
    parseEther(".4"),
  );
  expect((await contract.getJob(1)).escrowAmount).toBe(0n);
  checks.push(
    "Approval released exactly 0.40 ETH to freelancer and cleared escrow",
  );
  await go("/jobs/1/completed");
  await shot("10-completed");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("10-completed-mobile");
  await noOverflow("completed mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/dashboard");
  await shot("15-client-dashboard");
  await page.getByRole("button", { name: "Freelancer", exact: true }).click();
  await switchAccount(1);
  await shot("16-freelancer-dashboard");
  await go("/transactions?job=1");
  await expect(
    page.getByRole("list").getByText("Payment Released", { exact: true }),
  ).toBeVisible();
  await shot("17-transactions");
  await page.locator(".wallet-control > button").click();
  await shot("18-wallet-dropdown");
  await page.keyboard.press("Escape");
  wrong = true;
  await page.evaluate(() => window.testWalletEvent("chainChanged", "0x1"));
  await expect(page.getByText("Wrong Network", { exact: true })).toBeVisible();
  await shot("19-wrong-network");
  await page.getByRole("button", { name: "Switch to Sepolia" }).click();
  await expect(page.getByText("Wrong Network", { exact: true })).toHaveCount(0);
  checks.push("Wrong network is visible and switch restores Sepolia");
  await switchAccount(0);
  await go("/jobs/2");
  reject = true;
  await page.getByRole("button", { name: "Cancel Job", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel Job", exact: true })
    .click();
  await expect(
    page.getByText("Transaction failed", { exact: true }),
  ).toBeVisible();
  expect((await contract.getJob(2)).status).toBe(0n);
  await shot("20-transaction-failure");
  checks.push("Rejected wallet action leaves blockchain state unchanged");
  for (const route of [
    "/",
    "/explore",
    "/create",
    "/jobs/1/completed",
    "/jobs/2",
    "/dashboard",
    "/transactions",
    "/help",
  ]) {
    await page.setViewportSize({ width: 375, height: 812 });
    await go(route);
    await noOverflow(route);
  }
  checks.push("Eight routes checked at 375px with no horizontal overflow");
  const unauthorizedMetadata = {
    title: "Unauthorized",
    description: "Should not save",
  };
  const badSignature = await Wallet.createRandom().signMessage("invalid");
  const bad = await fetch("http://127.0.0.1:5180/api/metadata/1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: unauthorizedMetadata,
      signature: badSignature,
    }),
  });
  expect(bad.status).toBe(403);
  checks.push("Metadata writes reject non-client signatures");
  expect(errors).toEqual([]);
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser?.close();
  await server?.close();
  provider.destroy();
  anvil.kill();
}
