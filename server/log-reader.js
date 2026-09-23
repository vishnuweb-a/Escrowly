// Some Sepolia RPC plans cap eth_getLogs at ten blocks per request.
// Adapt to the advertised cap and preserve every block at chunk boundaries.
export function createLogReader(provider, address) {
  let range = 5000;
  const cache = new Map();
  const readChunk = async filter => {
    const key = JSON.stringify(filter), cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = await provider.send('eth_getLogs', [filter]);
    if (cache.size >= 1000) cache.delete(cache.keys().next().value);
    cache.set(key, { value, expires: Date.now() + 30000 });
    return value;
  };
  return async function read(filter) {
    const from = Number(filter?.fromBlock), to = Number(filter?.toBlock);
    if (filter?.address?.toLowerCase() !== address.toLowerCase() || !Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to < from || to-from >= 5000) throw new Error('Unsupported escrow log range.');
    const chunks = [];
    for (let start = from; start <= to; start += range) chunks.push({ ...filter, fromBlock:'0x'+start.toString(16), toBlock:'0x'+Math.min(start+range-1,to).toString(16) });
    const logs = [];
    try {
      for (let i=0;i<chunks.length;i+=4) logs.push(...(await Promise.all(chunks.slice(i,i+4).map(readChunk))).flat());
      return logs;
    } catch (error) {
      const message = error.info?.error?.message || error.error?.message || error.message || '';
      const limit = Number(message.match(/up to (?:a )?(\d+) block range/i)?.[1]);
      if (limit > 0 && limit < range) { range = limit; return read(filter); }
      throw error;
    }
  };
}
