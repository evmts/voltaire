import { bench, describe } from "vitest";
import * as ethers from "./lt-ethers.js";
import * as guilNative from "./lt-guil-native.js";
import * as guilWasm from "./lt-guil-wasm.js";
import * as viem from "./lt-viem.js";

describe("uint256.lt", () => {
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
