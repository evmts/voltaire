import { bench, describe } from 'vitest';
import * as guil from './gweiToWei/guil.js';
import * as ethers from './gweiToWei/ethers.js';
import * as viem from './gweiToWei/viem.js';

describe('gweiToWei', () => {
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
