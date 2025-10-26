import { bench, describe } from "vitest";
import * as ethers from "./min-ethers.js";
import * as guilNative from "./min-guil-native.js";
import * as guilWasm from "./min-guil-wasm.js";
import * as viem from "./min-viem.js";

describe("uint256.min", () => {
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
