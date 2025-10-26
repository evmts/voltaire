import { bench, describe } from 'vitest';
import * as guilNative from './etherToWei/guil-native.js';
import * as guilWasm from './etherToWei/guil-wasm.js';
import * as ethers from './etherToWei/ethers.js';
import * as viem from './etherToWei/viem.js';

describe('etherToWei', () => {
	bench('guil-native', () => {
		guilNative.main();
	});

	bench('guil-wasm', () => {
		guilWasm.main();
	});

	bench('ethers', () => {
		ethers.main();
	});

	bench('viem', () => {
		viem.main();
	});
});
