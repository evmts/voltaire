import { bench, describe } from "vitest";
import * as ethers from "./byteToNumber/ethers.js";
import * as guilNative from "./byteToNumber/guil-native.js";
import * as guilWasm from "./byteToNumber/guil-wasm.js";
import * as viem from "./byteToNumber/viem.js";

describe("byteToNumber", () => {
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
