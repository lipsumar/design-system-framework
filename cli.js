#!/usr/bin/env node

// get script arguments without the first two ("node" and "cli.js" )
var ARGV = process.argv.slice(2);

// vanity screen
console.log('   ⌜                         ⌝');
console.log('     Design System Framework  ');
console.log('   ⌞                         ⌟');
console.log('');


// simply start server
require('./lib/server.js');

require('openurl').open('http://localhost:3000');


