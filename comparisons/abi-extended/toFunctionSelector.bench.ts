import { bench, describe } from "vitest";
import * as guilNative from "./toFunctionSelector-guil-native.js";
import * as guilWasm from "./toFunctionSelector-guil-wasm.js";
import * as ethers from "./toFunctionSelector-ethers.js";
import * as viem from "./toFunctionSelector-viem.js";

describe("toFunctionSelector", () => {
	bench("guil-native (computeSelector)", () => {
		guilNative.main();
	});

	bench("guil-wasm (computeSelector)", () => {
		guilWasm.main();
	});

	bench("ethers", () => {
		ethers.main();
	});

	bench("viem", () => {
		viem.main();
	});
});
