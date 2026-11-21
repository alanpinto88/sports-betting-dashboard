// Run: node tests/nba-market-pairing.test.mjs
import assert from 'node:assert/strict';
function pair(prices,line){
 const same=prices.filter(x=>x.line===line&&Number.isFinite(x.price?.american));
 const book=[...new Set(same.map(x=>x.book))].find(b=>same.some(x=>x.book===b&&x.side==='over')&&same.some(x=>x.book===b&&x.side==='under'));
 return book?{book,over:same.find(x=>x.book===book&&x.side==='over'),under:same.find(x=>x.book===book&&x.side==='under')}:null;
}
const quotes=[{book:'A',side:'over',line:24.5,price:{american:-110}},{book:'B',side:'under',line:24.5,price:{american:-115}}];
assert.equal(pair(quotes,24.5),null,'Never combine prices from different books');
assert.equal(pair([...quotes,{book:'A',side:'under',line:25.5,price:{american:-120}}],24.5),null,'Never combine different thresholds');
assert.equal(pair([...quotes,{book:'A',side:'under',line:24.5,price:{american:-120}}],24.5)?.book,'A');
assert.equal(pair([{book:'A',side:'over',line:24.5,price:{american:-110}},{book:'A',side:'under',line:24.5,price:{american:null}}],24.5),null);
console.log('NBA market pairing: 4 checks passed');
