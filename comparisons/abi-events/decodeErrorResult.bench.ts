import { bench, describe } from 'vitest';
import * as guil from './decodeErrorResult/guil.js';
import * as ethers from './decodeErrorResult/ethers.js';
import * as viem from './decodeErrorResult/viem.js';

describe('decodeErrorResult', () => {
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
