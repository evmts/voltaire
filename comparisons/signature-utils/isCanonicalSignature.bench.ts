import { bench, describe } from "vitest";
import * as ethers from "./isCanonicalSignature/ethers.js";
import * as guilNative from "./isCanonicalSignature/guil-native.js";
import * as guilWasm from "./isCanonicalSignature/guil-wasm.js";
import * as viem from "./isCanonicalSignature/viem.js";

describe("isCanonicalSignature", () => {
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
