import { bench, describe } from "vitest";
import * as ethers from "./normalizeSignature/ethers.js";
import * as guilNative from "./normalizeSignature/guil-native.js";
import * as guilWasm from "./normalizeSignature/guil-wasm.js";
import * as viem from "./normalizeSignature/viem.js";

describe("normalizeSignature", () => {
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
