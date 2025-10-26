import { bench, describe } from "vitest";
import * as guilNative from "./guil-native.js";
import * as guilWasm from "./guil-wasm.js";
// import * as ethers from './ethers.js'; // EIP-7702 not supported yet
import * as viem from "./viem.js";

describe("serializeEip7702", () => {
	bench("guil-native", () => {
		guilNative.main();
	});

	bench("guil-wasm", () => {
		guilWasm.main();
	});

	// Ethers does not support EIP-7702 yet
	// bench('ethers', () => {
	// 	ethers.main();
	// });

	bench("viem", () => {
		viem.main();
	});
});
