import { bench, describe } from "vitest";
import * as guilNative from "./stringToBytes/guil-native.js";
import * as guilWasm from "./stringToBytes/guil-wasm.js";
import * as ethers from "./stringToBytes/ethers.js";
import * as viem from "./stringToBytes/viem.js";

describe("stringToBytes", () => {
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
