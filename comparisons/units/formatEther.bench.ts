import { bench, describe } from "vitest";
import * as ethers from "./formatEther-ethers.js";
import * as guilNative from "./formatEther-guil-native.js";
import * as guilWasm from "./formatEther-guil-wasm.js";
import * as viem from "./formatEther-viem.js";

describe("formatEther", () => {
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
