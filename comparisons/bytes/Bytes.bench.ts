import { bench, describe } from "vitest";
import * as guilNative from "./Bytes/guil-native.js";
import * as guilWasm from "./Bytes/guil-wasm.js";
import * as ethers from "./Bytes/ethers.js";
import * as viem from "./Bytes/viem.js";

describe("Bytes constructor", () => {
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
