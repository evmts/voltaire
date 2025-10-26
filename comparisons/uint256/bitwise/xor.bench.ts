import { bench, describe } from "vitest";
import * as guilNative from "./xor-guil-native.js";
import * as guilWasm from "./xor-guil-wasm.js";
import * as ethers from "./xor-ethers.js";
import * as viem from "./xor-viem.js";

describe("uint256.xor", () => {
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
