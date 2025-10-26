import { bench, describe } from "vitest";
import * as ethers from "./parseSignature/ethers.js";
import * as guilNative from "./parseSignature/guil-native.js";
import * as guilWasm from "./parseSignature/guil-wasm.js";
import * as viem from "./parseSignature/viem.js";

describe("parseSignature", () => {
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
