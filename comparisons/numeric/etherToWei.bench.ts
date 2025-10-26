import { bench, describe } from 'vitest';
import * as guil from './etherToWei/guil.js';
import * as ethers from './etherToWei/ethers.js';
import * as viem from './etherToWei/viem.js';

describe('etherToWei', () => {
	bench('guil', () => {
		guil.main();
	});

	bench('ethers', () => {
		ethers.main();
	});

	bench('viem', () => {
		viem.main();
	});
});
