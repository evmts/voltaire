import { bench, describe } from "vitest";
import * as guilNative from "./decodeFunctionData-guil-native.js";
import * as guilWasm from "./decodeFunctionData-guil-wasm.js";
import * as ethers from "./decodeFunctionData-ethers.js";
import * as viem from "./decodeFunctionData-viem.js";

describe("decodeFunctionData", () => {
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
