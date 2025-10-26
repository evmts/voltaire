import { bench, describe } from "vitest";
import * as guilNative from "./mod-guil-native.js";
import * as guilWasm from "./mod-guil-wasm.js";
import * as ethers from "./mod-ethers.js";
import * as viem from "./mod-viem.js";

describe("uint256.mod", () => {
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
