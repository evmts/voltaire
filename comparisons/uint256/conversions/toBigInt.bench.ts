import { bench, describe } from "vitest";
import * as guilNative from "./toBigInt-guil-native.js";
import * as guilWasm from "./toBigInt-guil-wasm.js";
import * as ethers from "./toBigInt-ethers.js";
import * as viem from "./toBigInt-viem.js";

describe("uint256.toBigInt", () => {
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
