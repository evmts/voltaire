import { bench, describe } from "vitest";
import * as guilNative from "./parseGwei-guil-native.js";
import * as guilWasm from "./parseGwei-guil-wasm.js";
import * as ethers from "./parseGwei-ethers.js";
import * as viem from "./parseGwei-viem.js";

describe("parseGwei", () => {
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
