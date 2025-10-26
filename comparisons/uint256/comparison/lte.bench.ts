import { bench, describe } from "vitest";
import * as guilNative from "./lte-guil-native.js";
import * as guilWasm from "./lte-guil-wasm.js";
import * as ethers from "./lte-ethers.js";
import * as viem from "./lte-viem.js";

describe("uint256.lte", () => {
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
