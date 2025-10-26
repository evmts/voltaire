import { bench, describe } from "vitest";
import * as ethers from "./shl-ethers.js";
import * as guilNative from "./shl-guil-native.js";
import * as guilWasm from "./shl-guil-wasm.js";
import * as viem from "./shl-viem.js";

describe("uint256.shl", () => {
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
