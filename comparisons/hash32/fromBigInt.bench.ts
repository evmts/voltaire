import { bench, describe } from "vitest";
import * as guilNative from "./fromBigInt/guil-native.js";
import * as guilWasm from "./fromBigInt/guil-wasm.js";
import * as ethers from "./fromBigInt/ethers.js";
import * as viem from "./fromBigInt/viem.js";

describe("Hash32 fromBigInt", () => {
	bench("guil-native", () => {
		guilNative.main();
	});

	bench("guil-wasm", () => {
		guilWasm.main();
	});

	bench("ethers", () => {
		ethers.main();
	});

	bench("viem", () => {
		viem.main();
	});
});
