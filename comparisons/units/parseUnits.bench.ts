import { bench, describe } from "vitest";
import * as guilNative from "./parseUnits-guil-native.js";
import * as guilWasm from "./parseUnits-guil-wasm.js";
import * as ethers from "./parseUnits-ethers.js";
import * as viem from "./parseUnits-viem.js";

describe("parseUnits", () => {
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
