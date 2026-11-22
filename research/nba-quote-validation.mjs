// EV Sports NBA quote validation — pure functions, no network requests or API credits.
// All prices and identities must be supplied by a verified upstream provider.
export function normalizeName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
export function normalizeMarket(value) {
  const key = normalizeName(value);
  const aliases = {pts:"points",point:"points",reb:"rebounds",rebound:"rebounds",ast:"assists",assist:"assists","three pointers made":"3 pointers made",threes:"3 pointers made"};
  return aliases[key] || key;
}
export function validateComparison(a,b,{maxAgeMinutes=15,now=Date.now()}={}) {
  const reasons=[];
  if (!a || !b) return {comparable:false,reasons:["missing_quote"]};
  const required=["playerId","eventId","market","period","line","side","timestamp","source"];
  for(const field of required) if(a[field]===undefined || a[field]===null || b[field]===undefined || b[field]===null) reasons.push("missing_"+field);
  if(reasons.length) return {comparable:false,reasons};
  if(String(a.playerId)!==String(b.playerId)) reasons.push("different_player");
  if(String(a.eventId)!==String(b.eventId)) reasons.push("different_event");
  if(normalizeMarket(a.market)!==normalizeMarket(b.market)) reasons.push("different_market");
  if(normalizeName(a.period)!==normalizeName(b.period)) reasons.push("different_period");
  if(typeof a.line!=="number" || typeof b.line!=="number" || !Number.isFinite(a.line) || !Number.isFinite(b.line) || a.line!==b.line) reasons.push("different_line");
  if(normalizeName(a.side)!==normalizeName(b.side)) reasons.push("different_side");
  for(const q of [a,b]){
    const time=Date.parse(q.timestamp);
    if(!Number.isFinite(time) || time>now || now-time>maxAgeMinutes*60000) reasons.push("stale_or_invalid_timestamp");
    if(q.verified!==true) reasons.push("unverified_source");
  }
  return {comparable:reasons.length===0,reasons:[...new Set(reasons)]};
}
export function americanToProbability(odds){
  const n=Number(odds);
  if(typeof odds!=="number" || !Number.isFinite(n) || n===0 || Math.abs(n)<100) return null;
  return n>0?100/(n+100):(-n)/(-n+100);
}
export function noVigProbability(overOdds,underOdds){
  const over=americanToProbability(overOdds),under=americanToProbability(underOdds);
  if(over===null || under===null) return null;
  return {over:over/(over+under),under:under/(over+under)};
}
export function evaluateEV({comparison,modelProbability,americanOdds,modelVerified=false}){
  if(!comparison?.comparable || !modelVerified) return {enabled:false,reason:"unverified_comparison_or_model"};
  const p=Number(modelProbability),odds=Number(americanOdds);
  if(typeof modelProbability!=="number" || typeof americanOdds!=="number" || !Number.isFinite(p)||p<0||p>1||americanToProbability(odds)===null) return {enabled:false,reason:"invalid_inputs"};
  const profit=odds>0?odds/100:100/(-odds);
  return {enabled:true,evPerUnit:p*profit-(1-p)};
}

/**
 * Validate a published research snapshot before allowing quote comparisons.
 * A provider's verified flag alone is not proof of upstream authenticity.
 * trustedSourceIds must be populated by a separate, audited ingestion process.
 */
export function validatePublishedSnapshot(payload,{trustedSourceIds=[],now=Date.now(),maxAgeMinutes=15}={}){
 const errors=[];
 if(!payload || !Array.isArray(payload.quotes)) return {valid:false,errors:["invalid_payload"],quotes:[]};
 if(!Array.isArray(trustedSourceIds)||trustedSourceIds.length===0) return {valid:false,errors:["no_trusted_sources"],quotes:[]};
 const trusted=new Set(trustedSourceIds);
 const quotes=[];
 for(const q of payload.quotes){
  if(!q||typeof q!=="object"||!trusted.has(q.source)){errors.push("untrusted_source");continue}
  const required=["playerId","eventId","market","period","line","side","timestamp","source","americanOdds"];
  if(required.some(k=>q[k]===null||q[k]===undefined||q[k]==="")){errors.push("missing_fields");continue}
  if(typeof q.playerId!=="string"||!q.playerId.trim()||typeof q.eventId!=="string"||!q.eventId.trim()||typeof q.market!=="string"||!q.market.trim()||typeof q.period!=="string"||!q.period.trim()||!["over","under"].includes(normalizeName(q.side))){errors.push("invalid_identity");continue}
  if(typeof q.line!=="number"||!Number.isFinite(q.line)||americanToProbability(q.americanOdds)===null){errors.push("invalid_price");continue}
  const t=Date.parse(q.timestamp);
  if(!Number.isFinite(t)||t>now||now-t>maxAgeMinutes*60000){errors.push("stale_timestamp");continue}
  if(q.verified!==true){errors.push("unverified_quote");continue}
  quotes.push(q);
 }
 return {valid:errors.length===0&&quotes.length>0,errors:[...new Set(errors)],quotes};
}
