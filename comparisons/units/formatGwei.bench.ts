import { bench, describe } from "vitest";
import * as guilNative from "./formatGwei-guil-native.js";
import * as guilWasm from "./formatGwei-guil-wasm.js";
import * as ethers from "./formatGwei-ethers.js";
import * as viem from "./formatGwei-viem.js";

describe("formatGwei", () => {
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
