import { bench, describe } from "vitest";
import * as guilNative from "./hexToString/guil-native.js";
import * as guilWasm from "./hexToString/guil-wasm.js";
import * as ethers from "./hexToString/ethers.js";
import * as viem from "./hexToString/viem.js";

describe("hexToString", () => {
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
