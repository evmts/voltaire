import { bench, describe } from "vitest";
import * as guilNative from "./isUint/guil-native.js";
import * as guilWasm from "./isUint/guil-wasm.js";
import * as ethers from "./isUint/ethers.js";
import * as viem from "./isUint/viem.js";

describe("isUint", () => {
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
