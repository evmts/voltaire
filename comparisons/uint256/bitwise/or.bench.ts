import { bench, describe } from "vitest";
import * as guilNative from "./or-guil-native.js";
import * as guilWasm from "./or-guil-wasm.js";
import * as ethers from "./or-ethers.js";
import * as viem from "./or-viem.js";

describe("uint256.or", () => {
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
