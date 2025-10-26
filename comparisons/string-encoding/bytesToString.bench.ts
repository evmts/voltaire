import { bench, describe } from "vitest";
import * as guilNative from "./bytesToString/guil-native.js";
import * as guilWasm from "./bytesToString/guil-wasm.js";
import * as ethers from "./bytesToString/ethers.js";
import * as viem from "./bytesToString/viem.js";

describe("bytesToString", () => {
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
