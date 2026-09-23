import { Contract, JsonRpcProvider } from "ethers";
import abi from "./abi.json";
export { abi };
let current;
export async function setup() {
  if (!current)
    current = fetch("/api/config")
      .then(async (r) => {
        if (!r.ok) throw new Error("Contract configuration is unavailable.");
        const config = await r.json();
        const provider = new JsonRpcProvider(
          `${window.location.origin}/api/rpc`,
          config.chainId,
          { staticNetwork: true, batchMaxCount: 10 },
        );
        return {
          config,
          provider,
          contract: new Contract(config.address, abi, provider),
        };
      })
      .catch((e) => {
        current = null;
        throw e;
      });
  return current;
}
export async function readJob(id) {
  const { contract } = await setup();
  const [raw, count, response] = await Promise.all([
    contract.getJob(id),
    contract.getApplicationsCount(id),
    fetch(`/api/metadata/${id}`),
  ]);
  const metadata = response.ok ? await response.json() : null;
  return {
    ...raw.toObject(),
    status: Number(raw.status),
    count: Number(count),
    metadata,
    title: metadata?.title || `Escrow project #${id}`,
    description:
      metadata?.description ||
      "The client has not published additional project details.",
    skills: metadata?.skills || [],
  };
}
export async function readJobs() {
  const { contract } = await setup();
  const count = Number(await contract.jobCounter());
  const jobs = [];
  for (let end = count; end > 0; end -= 8)
    jobs.push(
      ...(await Promise.all(
        Array.from({ length: Math.min(end, 8) }, (_, i) => readJob(end - i)),
      )),
    );
  return jobs;
}
export async function readApplications(id) {
  const { contract } = await setup();
  const count = Number(await contract.getApplicationsCount(id));
  return Promise.all(
    Array.from({ length: count }, async (_, index) => ({
      ...(await contract.getApplication(id, index)).toObject(),
      index,
    })),
  );
}
export async function readEvents(jobId) {
  const { contract, config, provider } = await setup();
  const latest = await provider.getBlockNumber();
  const topics = jobId
    ? [null, "0x" + BigInt(jobId).toString(16).padStart(64, "0")]
    : [];
  const logs = [];
  for (let from = config.deploymentBlock; from <= latest; from += 5000)
    logs.push(
      ...(await provider.getLogs({
        address: config.address,
        fromBlock: from,
        toBlock: Math.min(from + 4999, latest),
        topics,
      })),
    );
  const times = new Map();
  return Promise.all(
    logs.reverse().map(async (log) => {
      const parsed = contract.interface.parseLog(log);
      if (!times.has(log.blockNumber))
        times.set(log.blockNumber, provider.getBlock(log.blockNumber));
      const block = await times.get(log.blockNumber);
      return {
        name: parsed.name,
        args: parsed.args.toObject(),
        hash: log.transactionHash,
        index: log.index,
        timestamp: block.timestamp,
        jobId: String(parsed.args.jobId),
      };
    }),
  );
}
export async function publishMetadata(id, metadata, signer) {
  const { config } = await setup();
  const signature = await signer.signMessage(
    `Escrowly project details\n${config.chainId}:${config.address.toLowerCase()}:${id}\n${JSON.stringify(metadata)}`,
  );
  const res = await fetch(`/api/metadata/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata, signature }),
  });
  if (!res.ok)
    throw new Error(
      "The job is on-chain, but publishing its description failed. Retry from the project page.",
    );
}
