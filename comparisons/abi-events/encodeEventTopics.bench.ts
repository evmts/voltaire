import { bench, describe } from 'vitest';
import * as guil from './encodeEventTopics/guil.js';
import * as ethers from './encodeEventTopics/ethers.js';
import * as viem from './encodeEventTopics/viem.js';

describe('encodeEventTopics', () => {
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
