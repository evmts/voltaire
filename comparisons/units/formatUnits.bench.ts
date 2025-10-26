import { bench, describe } from "vitest";
import * as ethers from "./formatUnits-ethers.js";
import * as guilNative from "./formatUnits-guil-native.js";
import * as guilWasm from "./formatUnits-guil-wasm.js";
import * as viem from "./formatUnits-viem.js";

describe("formatUnits", () => {
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
