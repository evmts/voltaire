import { bench, describe } from "vitest";
import * as ethers from "./and-ethers.js";
import * as guilNative from "./and-guil-native.js";
import * as guilWasm from "./and-guil-wasm.js";
import * as viem from "./and-viem.js";

describe("uint256.and", () => {
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
