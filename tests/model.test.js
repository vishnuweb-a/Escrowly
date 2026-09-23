import test from "node:test";
import assert from "node:assert/strict";
import { parseEther } from "ethers";
import {
  STATUSES,
  permissions,
  eth,
  amount,
  safeURL,
  encodeDocument,
  decodeDocument,
} from "../frontend/lib/model.js";
import fs from "node:fs";
test("status order matches the Solidity enum", () => {
  const source = fs.readFileSync("src/FreelanceEscrow.sol", "utf8");
  const values = source
    .match(/enum JobStatus\s*\{([^}]+)\}/)[1]
    .split(",")
    .map((s) => s.trim());
  assert.deepEqual(
    values,
    STATUSES.map((s) => s.toUpperCase().replaceAll(" ", "_")),
  );
});
test("every action respects both on-chain role and state", () => {
  const roles = {
    client: "client",
    freelancer: "freelancer",
    stranger: "stranger",
    disconnected: null,
  };
  const expected = {
    apply: [
      ["freelancer", 0],
      ["stranger", 0],
    ],
    select: [["client", 0]],
    fund: [["client", 1]],
    start: [["freelancer", 2]],
    submit: [["freelancer", 3]],
    approve: [["client", 4]],
    cancel: [
      ["client", 0],
      ["client", 1],
    ],
  };
  for (let status = 0; status < 7; status++)
    for (const [role, account] of Object.entries(roles))
      for (const [action, pairs] of Object.entries(expected))
        assert.equal(
          permissions(
            { client: "client", freelancer: "freelancer", status },
            account,
          )[action],
          pairs.some(([r, s]) => r === role && s === status),
          `${role}/${status}/${action}`,
        );
});
test("ETH values preserve precision and reject zero or invalid inputs", () => {
  assert.equal(eth(parseEther("0.4")), "0.40");
  assert.equal(eth(1n), "0.000000000000000001");
  assert.throws(() => amount("0"));
  assert.throws(() => amount("-1"));
  assert.throws(() => amount("abc"));
  assert.equal(amount("0.4"), parseEther("0.4"));
});
test("untrusted submission links cannot execute script", () => {
  assert.equal(safeURL("javascript:alert(1)"), null);
  assert.equal(safeURL("data:text/html,test"), null);
  assert.equal(safeURL("https://example.com/work"), "https://example.com/work");
  assert.equal(safeURL("ipfs://example"), "https://ipfs.io/ipfs/example");
});
test("public proposal and submission documents round-trip", () => {
  const doc = {
    text: "A detailed proposal ✓",
    url: "https://example.com",
    note: "Ready for review",
  };
  assert.deepEqual(decodeDocument(encodeDocument(doc)), doc);
  assert.deepEqual(decodeDocument("https://example.com"), {
    url: "https://example.com",
  });
});
