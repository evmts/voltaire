import { bench, describe } from 'vitest';
import * as guil from './weiToGwei/guil.js';
import * as ethers from './weiToGwei/ethers.js';
import * as viem from './weiToGwei/viem.js';

describe('weiToGwei', () => {
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
