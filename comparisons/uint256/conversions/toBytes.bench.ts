import { bench, describe } from "vitest";
import * as ethers from "./toBytes-ethers.js";
import * as guilNative from "./toBytes-guil-native.js";
import * as guilWasm from "./toBytes-guil-wasm.js";
import * as viem from "./toBytes-viem.js";

describe("uint256.toBytes", () => {
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
