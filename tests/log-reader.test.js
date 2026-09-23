import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogReader } from '../server/log-reader.js';
test('restricted RPC ranges include every boundary block and reuse cached chunks',async()=>{
  let calls=0;
  const provider={send:async (_method,[filter])=>{calls++;const from=Number(filter.fromBlock),to=Number(filter.toBlock);if(to-from>=10)throw {error:{message:'Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block range.'}};return Array.from({length:to-from+1},(_,i)=>({block:from+i}));}};
  const read=createLogReader(provider,'contract');
  const result=await read({address:'contract',fromBlock:'0x64',toBlock:'0x80'});
  assert.deepEqual(result.map(l=>l.block),Array.from({length:29},(_,i)=>100+i));
  assert.equal(calls,4);
  await read({address:'contract',fromBlock:'0x64',toBlock:'0x80'});
  assert.equal(calls,4);
  await assert.rejects(()=>read({address:'unrelated',fromBlock:'0x64',toBlock:'0x80'}));
});
