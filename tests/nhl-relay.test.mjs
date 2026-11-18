// Run: node --test tests/nhl-relay.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/nhl-final-relay.mjs';
const endpoint='https://relay.example/nhl/final/2026020123';
const origin='https://alanpinto88.github.io';
const request=(url=endpoint,options={})=>new Request(url,{headers:{Origin:origin,...options.headers},method:options.method||'GET'});
const originalFetch=globalThis.fetch;
test('rejects other origins, methods, malformed IDs and query strings',async()=>{
 assert.equal((await worker.fetch(request(endpoint,{headers:{Origin:'https://evil.example'}}))).status,403);
 assert.equal((await worker.fetch(request(endpoint,{method:'POST'}))).status,405);
 assert.equal((await worker.fetch(request('https://relay.example/nhl/final/abc'))).status,400);
 assert.equal((await worker.fetch(request(endpoint+'?url=https://evil.example'))).status,400);
});
test('returns only validated final scores, never settlement authorization',async()=>{
 let requested='';
 globalThis.fetch=async url=>{requested=url;return new Response(JSON.stringify({id:2026020123,gameState:'OFF',homeTeam:{abbrev:'NYR',score:3},awayTeam:{abbrev:'BOS',score:2},privateField:'ignore'}),{status:200})};
 try{
  const response=await worker.fetch(request());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.deepEqual(await response.json(),{gameId:'2026020123',state:'OFF',home:{team:'NYR',score:3},away:{team:'BOS',score:2},source:'NHL gamecenter',settlementEligible:false});
  assert.equal(requested,'https://api-web.nhle.com/v1/gamecenter/2026020123/landing');
 }finally{globalThis.fetch=originalFetch}
});
test('rejects unfinished games and mismatched IDs',async()=>{
 try{
  for(const [id,state] of [[2026020123,'LIVE'],[2026029999,'OFF']]){
   globalThis.fetch=async()=>new Response(JSON.stringify({id,gameState:state,homeTeam:{abbrev:'NYR',score:3},awayTeam:{abbrev:'BOS',score:2}}),{status:200});
   assert.equal((await worker.fetch(request())).status,409);
  }
 }finally{globalThis.fetch=originalFetch}
});
test('upstream errors fail closed',async()=>{
 globalThis.fetch=async()=>new Response('unavailable',{status:503});
 try{assert.equal((await worker.fetch(request())).status,502)}finally{globalThis.fetch=originalFetch}
});
