#!/usr/bin/env node
if (!process.argv.includes('--stdio')) {
  process.argv.push('--stdio');
}
import('../dist/index.js');
