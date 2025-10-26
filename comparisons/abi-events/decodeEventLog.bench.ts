import { bench, describe } from 'vitest';
import * as guil from './decodeEventLog/guil.js';
import * as ethers from './decodeEventLog/ethers.js';
import * as viem from './decodeEventLog/viem.js';

describe('decodeEventLog', () => {
  bench('guil (viem fallback)', () => {
    guil.main();
  });

  bench('ethers', () => {
    ethers.main();
  });

  bench('viem', () => {
    viem.main();
  });
});
