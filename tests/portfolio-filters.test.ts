import test from 'node:test';
import assert from 'node:assert/strict';
import {portfolioFilters,portfolioBrowseCopy,publicPortfolioCategory,resolvePortfolioFilter} from '../apps/web/lib/portfolio-filters';
test('stored, historical and unknown categories retain an explicit public destination',()=>{
 const expected={'web-development':'websites','3d-printing':'3d-printing','linux-servers':'linux-servers','pc-support':'services',design:'services','google-business':'services','digital-support':'services','data-protection':'services',other:'services','digital-help':'services','future-category':'services'};
 for(const [category,filter] of Object.entries(expected))assert.equal(publicPortfolioCategory(category),filter,category);
});
test('legacy shared URLs resolve without changing stored identifiers',()=>{
 for(const [old,current] of Object.entries({web:'websites',pc:'services',design:'services',digital:'services',print:'3d-printing',linux:'linux-servers'}))assert.equal(resolvePortfolioFilter({filter:old}),current);
 assert.equal(resolvePortfolioFilter({category:'digital-support',filter:'websites'}),'services');assert.equal(resolvePortfolioFilter({category:'future-category'}),'services');assert.equal(resolvePortfolioFilter({filter:'unrecognized'}),'all');
 for(const filter of portfolioFilters)assert.equal(resolvePortfolioFilter({filter}),filter);
});
test('exactly five translated public groups and accessible state copy in all six locales',()=>{
 for(const locale of ['en','de','fr','sk','uk','ru']){const copy=portfolioBrowseCopy(locale);assert.deepEqual(Object.keys(copy.filters),[...portfolioFilters]);for(const value of Object.values(copy))if(typeof value==='string')assert.ok(value.trim());}
 assert.deepEqual(Object.values(portfolioBrowseCopy('en').filters),['All Projects','Websites','Service Works','3D Printing','Linux & Servers']);
});
