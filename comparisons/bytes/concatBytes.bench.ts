import { bench, describe } from "vitest";
import * as ethers from "./concatBytes/ethers.js";
import * as guilNative from "./concatBytes/guil-native.js";
import * as guilWasm from "./concatBytes/guil-wasm.js";
import * as viem from "./concatBytes/viem.js";

describe("concatBytes", () => {
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
