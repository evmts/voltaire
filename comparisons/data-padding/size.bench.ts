import { bench, describe } from "vitest";
import * as guilNative from "./size/guil-native.js";
import * as guilWasm from "./size/guil-wasm.js";
import * as ethers from "./size/ethers.js";
import * as viem from "./size/viem.js";

describe("size", () => {
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
