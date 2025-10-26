import { bench, describe } from "vitest";
import * as ethers from "./sub-ethers.js";
import * as guilNative from "./sub-guil-native.js";
import * as guilWasm from "./sub-guil-wasm.js";
import * as viem from "./sub-viem.js";

describe("uint256.sub", () => {
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
