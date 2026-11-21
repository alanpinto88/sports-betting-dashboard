import assert from 'node:assert/strict';
import {crossEventReview} from '../lib/nba-identity-review.mjs';
const quote=(name)=>({description:name,name:'Over',point:10.5,price:-110});
const event=(id,name,book='fixture')=>({id,bookmakers:[{key:book,markets:[{key:'player_points',outcomes:[quote(name),quote(name)]}]}]});
assert.deepEqual(crossEventReview({events:[event('1','Same Name'),event('2','same   name')]}).map(x=>[x.name,x.eventCount,x.bookCount,x.status]),[['Same Name',2,1,'needs_review']]);
assert.equal(crossEventReview({events:[event('1','Same Name'),event('1','Same Name')]}).length,0);
assert.equal(crossEventReview({events:[event('1','A'),event('2','B')]}).length,0);
assert.throws(()=>crossEventReview({}),/Invalid events/);
console.log('NBA cross-event identity review fixtures passed');
