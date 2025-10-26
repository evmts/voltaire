import { bench, describe } from "vitest";
import * as ethers from "./not-ethers.js";
import * as guilNative from "./not-guil-native.js";
import * as guilWasm from "./not-guil-wasm.js";
import * as viem from "./not-viem.js";

describe("uint256.not", () => {
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
