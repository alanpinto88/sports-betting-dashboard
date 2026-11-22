// Historical research only. A hit rate is not a probability or a verified EV signal.
export function calculateNbaPropHitRate({games,stat,line,side='over',before}){
 const allowed=['points','rebounds','assists'];
 if(!allowed.includes(stat)||!Array.isArray(games)||!Number.isFinite(line)||line<0||
   !['over','under'].includes(side)||!Number.isFinite(Date.parse(before)))
  throw Error('Invalid NBA prop research inputs');
 const cutoff=Date.parse(before),seen=new Set(),valid=[];
 for(const g of games){
  const id=String(g?.gameId??''),time=Date.parse(g?.startTime);
  if(!/^\d+$/.test(id)||!Number.isFinite(time))continue;
  if(seen.has(id))throw Error('Duplicate historical game ID');
  seen.add(id);
  if(time>=cutoff||g.final!==true||g.status!=='stats_available'||g.stats?.didNotPlay)continue;
  const value=g.stats?.[stat];
  if(!Number.isFinite(value)||value<0)continue;
  valid.push({id,time,value});
 }
 valid.sort((a,b)=>b.time-a.time);
 const lastFive=valid.slice(0,5);
 const hits=lastFive.filter(g=>side==='over'?g.value>line:g.value<line).length;
 const pushes=lastFive.filter(g=>g.value===line).length;
 const decisions=lastFive.length-pushes;
 return {stat,line,side,games:lastFive.length,hits,pushes,decisions,
  hitRate:decisions?+(hits/decisions*100).toFixed(1):null,
  sampleComplete:lastFive.length===5,gameIds:lastFive.map(g=>g.id),
  researchOnly:true,verifiedQuote:false,evEligible:false};
}
