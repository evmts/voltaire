import { bench, describe } from "vitest";
import * as guilNative from "./mul-guil-native.js";
import * as guilWasm from "./mul-guil-wasm.js";
import * as ethers from "./mul-ethers.js";
import * as viem from "./mul-viem.js";

describe("uint256.mul", () => {
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
