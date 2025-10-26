import { bench, describe } from "vitest";
import * as ethers from "./Byte/ethers.js";
import * as guilNative from "./Byte/guil-native.js";
import * as guilWasm from "./Byte/guil-wasm.js";
import * as viem from "./Byte/viem.js";

describe("Byte constructor", () => {
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
