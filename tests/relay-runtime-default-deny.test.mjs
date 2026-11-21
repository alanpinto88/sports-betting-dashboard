import assert from 'node:assert/strict';
import worker from '../worker/prop-comparison-relay.mjs';

let calls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;throw Error('Unexpected upstream fetch')};
try{
 const env={PRIZEPICKS_API_KEY:'TEST_SECRET_DO_NOT_USE',ALLOWED_ORIGIN:'https://alanpinto88.github.io'};
 const request=(path,method='GET')=>new Request('https://relay.example'+path,{method,headers:{Origin:'https://alanpinto88.github.io'}});
 const provider=await worker.fetch(request('/provider-check'),env,{});
 assert.equal(provider.status,403);
 const providerData=await provider.json();
 assert.equal(providerData.status,'diagnostic_disabled');
 assert.equal(providerData.paidRequestsEnabled,false);
 assert.equal(calls,0,'Default provider diagnostic must not fetch upstream');
 const comparisons=await worker.fetch(request('/comparisons'),env,{});
 assert.equal(comparisons.status,503);
 assert.equal((await comparisons.json()).status,'not_configured');
 assert.equal(calls,0,'Disabled comparisons must not fetch upstream');
 const status=await worker.fetch(request('/live-status'),env,{});
 const statusData=await status.json();
 assert.equal(statusData.creditSpendingEnabled,false);
 assert.equal(statusData.liveComparisonsEnabled,false);
 assert.equal(calls,0,'Status must not fetch upstream');
 assert.equal(status.headers.get('Access-Control-Allow-Origin'),'https://alanpinto88.github.io');
 const denied=await worker.fetch(new Request('https://relay.example/live-status',{headers:{Origin:'https://untrusted.example'}}),env,{});
 assert.equal(denied.headers.get('Access-Control-Allow-Origin'),'null');
 assert.equal(calls,0);
 console.log('Relay runtime default-deny: 13 assertions passed');
}finally{globalThis.fetch=originalFetch}
