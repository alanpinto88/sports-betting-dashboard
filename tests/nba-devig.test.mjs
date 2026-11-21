import assert from 'node:assert/strict';
const implied=odds=>Number.isFinite(odds)&&odds!==0?(odds<0?-odds/(-odds+100):100/(odds+100)):null;
function fair(over,under){
 const a=implied(over),b=implied(under);
 return a===null||b===null?null:a/(a+b);
}
assert.equal(fair(-110,-110),0.5);
assert.ok(Math.abs(fair(-120,-114)-0.50538)>0.00005,'Source example does not exactly reconcile');
assert.equal(fair(null,-110),null);
assert.equal(fair(0,-110),null);
assert.equal(fair(100,100),0.5);
console.log('NBA de-vig calculations: 5 checks passed');
