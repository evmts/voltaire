import { bench, describe } from "vitest";
import * as guilNative from "./fromBytes-guil-native.js";
import * as guilWasm from "./fromBytes-guil-wasm.js";
import * as ethers from "./fromBytes-ethers.js";
import * as viem from "./fromBytes-viem.js";

describe("uint256.fromBytes", () => {
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
