import { bench, describe } from "vitest";
import * as guilNative from "./max-guil-native.js";
import * as guilWasm from "./max-guil-wasm.js";
import * as ethers from "./max-ethers.js";
import * as viem from "./max-viem.js";

describe("uint256.max", () => {
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
