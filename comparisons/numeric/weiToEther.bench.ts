import { bench, describe } from 'vitest';
import * as guil from './weiToEther/guil.js';
import * as ethers from './weiToEther/ethers.js';
import * as viem from './weiToEther/viem.js';

describe('weiToEther', () => {
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
