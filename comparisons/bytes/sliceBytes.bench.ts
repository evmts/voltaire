import { bench, describe } from "vitest";
import * as ethers from "./sliceBytes/ethers.js";
import * as guilNative from "./sliceBytes/guil-native.js";
import * as guilWasm from "./sliceBytes/guil-wasm.js";
import * as viem from "./sliceBytes/viem.js";

describe("sliceBytes", () => {
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
