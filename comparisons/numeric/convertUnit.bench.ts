import { bench, describe } from 'vitest';
import * as guil from './convertUnit/guil.js';
import * as ethers from './convertUnit/ethers.js';
import * as viem from './convertUnit/viem.js';

describe('convertUnit', () => {
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
