import { bench, describe } from "vitest";
import * as guilNative from "./hexToBytes/guil-native.js";
import * as guilWasm from "./hexToBytes/guil-wasm.js";
import * as ethers from "./hexToBytes/ethers.js";
import * as viem from "./hexToBytes/viem.js";

describe("hexToBytes", () => {
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
