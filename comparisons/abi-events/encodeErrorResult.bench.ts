import { bench, describe } from 'vitest';
import * as guil from './encodeErrorResult/guil.js';
import * as ethers from './encodeErrorResult/ethers.js';
import * as viem from './encodeErrorResult/viem.js';

describe('encodeErrorResult', () => {
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
