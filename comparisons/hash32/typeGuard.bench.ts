import { bench, describe } from "vitest";
import * as guilNative from "./typeGuard/guil-native.js";
import * as guilWasm from "./typeGuard/guil-wasm.js";
import * as ethers from "./typeGuard/ethers.js";
import * as viem from "./typeGuard/viem.js";

describe("Hash32 typeGuard", () => {
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
