import { bench, describe } from "vitest";
import * as ethers from "./trim/ethers.js";
import * as guilNative from "./trim/guil-native.js";
import * as guilWasm from "./trim/guil-wasm.js";
import * as viem from "./trim/viem.js";

describe("trim", () => {
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
