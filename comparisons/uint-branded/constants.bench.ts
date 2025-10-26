import { bench, describe } from "vitest";
import * as ethers from "./constants/ethers.js";
import * as guilNative from "./constants/guil-native.js";
import * as guilWasm from "./constants/guil-wasm.js";
import * as viem from "./constants/viem.js";

describe("constants", () => {
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
