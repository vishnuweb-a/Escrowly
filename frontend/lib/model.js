import { formatEther, parseEther, ZeroAddress } from "ethers";
export const STATUSES = [
  "Open",
  "Freelancer selected",
  "Funded",
  "In progress",
  "Submitted",
  "Completed",
  "Cancelled",
];
export const EVENTS = {
  JobCreated: "Job Created",
  FreelancerApplied: "Application Submitted",
  FreelancerSelected: "Freelancer Selected",
  EscrowFunded: "Escrow Funded",
  WorkStarted: "Work Started",
  WorkSubmitted: "Work Submitted",
  PaymentReleased: "Payment Released",
  JobCancelled: "Job Cancelled",
};
export const short = (value) =>
  value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
export const eth = (value) => {
  const n = formatEther(value ?? 0n);
  return n.includes(".") && n.split(".")[1].length >= 2
    ? n
    : Number(n).toFixed(2);
};
// en-GB abbreviates September as "Sept"; the product uses three-letter months.
const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
export const date = (value) => {
  if (!value) return "—";
  const d = new Date(Number(value) * 1000);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
export const dateTime = (value) => {
  if (!value) return "—";
  const d = new Date(Number(value) * 1000);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${time}`;
};
export const daysLeft = (deadline) =>
  Math.ceil((Number(deadline) * 1000 - Date.now()) / 86400000);
export const same = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const present = (address) => !!address && address !== ZeroAddress;
export function permissions(job, account) {
  const client = same(job.client, account),
    freelancer = same(job.freelancer, account);
  return {
    client,
    freelancer,
    apply: !!account && !client && job.status === 0,
    select: client && job.status === 0,
    fund: client && job.status === 1,
    start: freelancer && job.status === 2,
    submit: freelancer && job.status === 3,
    approve: client && job.status === 4,
    cancel: client && [0, 1].includes(job.status),
  };
}
export function amount(value) {
  const parsed = parseEther(String(value));
  if (parsed <= 0n) throw new Error("Enter an ETH amount greater than zero.");
  return parsed;
}
export function safeURL(value) {
  try {
    if (value?.startsWith("ipfs://"))
      return `https://ipfs.io/ipfs/${value.slice(7)}`;
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function humanError(error) {
  if (error.code === 4001 || error.code === "ACTION_REJECTED")
    return "You declined the wallet request. No action was completed.";
  if (error.code === "INSUFFICIENT_FUNDS")
    return "Your wallet needs more Sepolia ETH for this transaction and gas.";
  if (error.code === "CALL_EXCEPTION")
    return (
      error.reason ||
      "The contract rejected this action. Refresh the project and check your wallet role."
    );
  if (
    error.code === "NETWORK_ERROR" ||
    error.code === "SERVER_ERROR" ||
    error.message === "Failed to fetch"
  )
    return "Sepolia could not be reached. Check your connection and try again.";
  return (
    error.reason ||
    (error.message?.length < 220
      ? error.message
      : "The request failed. Please refresh and try again.")
  );
}
export function decodeDocument(value) {
  try {
    if (value.startsWith("data:application/json,"))
      return JSON.parse(decodeURIComponent(value.slice(22)));
  } catch {
    /* Show the original reference when it is not an Escrowly document. */
  }
  return { url: value };
}
export const encodeDocument = (data) =>
  `data:application/json,${encodeURIComponent(JSON.stringify(data))}`;
