import { bench, describe } from "vitest";
import * as ethers from "./encodeFunctionData-ethers.js";
import * as guilNative from "./encodeFunctionData-guil-native.js";
import * as guilWasm from "./encodeFunctionData-guil-wasm.js";
import * as viem from "./encodeFunctionData-viem.js";

describe("encodeFunctionData", () => {
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
