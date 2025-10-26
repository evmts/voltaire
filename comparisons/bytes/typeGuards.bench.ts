import { bench, describe } from "vitest";
import * as ethers from "./typeGuards/ethers.js";
import * as guilNative from "./typeGuards/guil-native.js";
import * as guilWasm from "./typeGuards/guil-wasm.js";
import * as viem from "./typeGuards/viem.js";

describe("type guards (isBytes, isByte)", () => {
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
