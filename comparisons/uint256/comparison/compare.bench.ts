import { bench, describe } from "vitest";
import * as guilNative from "./compare-guil-native.js";
import * as guilWasm from "./compare-guil-wasm.js";
import * as ethers from "./compare-ethers.js";
import * as viem from "./compare-viem.js";

describe("uint256.compare", () => {
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
