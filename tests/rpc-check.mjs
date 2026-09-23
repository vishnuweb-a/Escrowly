import { JsonRpcProvider,Contract } from 'ethers';
import { loadEnv } from 'vite';
import fs from 'node:fs';
const env=loadEnv('development',process.cwd(),'');
const config=await(await fetch('http://127.0.0.1:5174/api/config')).json();
const provider=new JsonRpcProvider(env.SEPOLIA_RPC_URL);
const c=new Contract(config.address,JSON.parse(fs.readFileSync('frontend/lib/abi.json','utf8')),provider);
for(const [name,read] of [['job',()=>c.getJob(1)],['applications',()=>c.getApplicationsCount(1)],['logs',async()=>provider.getLogs({address:config.address,fromBlock:config.deploymentBlock,toBlock:await provider.getBlockNumber()})]]){
 try{const result=await read();console.log(name,Array.isArray(result)?`Read ${result.length} items`:'Read succeeded');}catch(e){console.log(name,e.shortMessage,e.info?.error?.message || e.error?.message || e.reason);}
}
provider.destroy();
