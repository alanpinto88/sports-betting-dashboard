// Run locally with: node tests/nba-quote-gates.test.mjs
import assert from 'node:assert/strict';
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
function eligible(payload,player,now=Date.now()){
 const entries=Array.isArray(payload?.data)?payload.data:[];
 return entries.some(item=>{
  const p=item?.projection,meta=payload?.meta,asof=Date.parse(meta?.as_of||'');
  const age=now-asof,ttl=Number(meta?.stale_after_seconds);
  return norm(p?.player?.name)===norm(player)&&String(p?.league||'').toUpperCase()==='NBA'
   &&String(p?.market?.stat||'').toLowerCase()==='points'
   &&Boolean(String(p?.player?.id||'').trim())&&Boolean(String(p?.player?.team||'').trim())
   &&Boolean(String(p?.event?.id||'').trim())&&Number.isFinite(p?.line)
   &&Number.isFinite(age)&&age>=0&&Number.isFinite(ttl)&&ttl>0&&age<=Math.min(ttl,600)*1000
   &&Array.isArray(item?.prices)&&item.prices.some(q=>Number.isFinite(q?.price?.american??q?.derived?.american));
 });
}
const now=Date.parse('2026-11-21T15:00:00Z');
const base={meta:{as_of:'2026-11-21T14:59:30Z',stale_after_seconds:120},data:[{projection:{league:'NBA',player:{id:'123',name:'Test Player',team:'NYK'},event:{id:'nba-event-1'},market:{stat:'Points'},line:24.5},prices:[{price:{american:-110}}]}]};
assert.equal(eligible(base,'Test Player',now),true);
assert.equal(eligible(base,'Other Player',now),false);
assert.equal(eligible({...base,data:[{...base.data[0],projection:{...base.data[0].projection,player:{name:'Test Player',team:'NYK'}}}]},'Test Player',now),false);
assert.equal(eligible({...base,meta:{...base.meta,as_of:'2026-11-21T14:40:00Z'}},'Test Player',now),false);
assert.equal(eligible({...base,data:[{...base.data[0],prices:[]}]},'Test Player',now),false);
assert.equal(eligible({...base,data:[{...base.data[0],projection:{...base.data[0].projection,event:{}}}]},'Test Player',now),false);
console.log('NBA quote eligibility gate: 6 checks passed');
