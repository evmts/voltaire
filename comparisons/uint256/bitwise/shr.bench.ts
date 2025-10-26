import { bench, describe } from "vitest";
import * as guilNative from "./shr-guil-native.js";
import * as guilWasm from "./shr-guil-wasm.js";
import * as ethers from "./shr-ethers.js";
import * as viem from "./shr-viem.js";

describe("uint256.shr", () => {
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
