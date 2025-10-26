import { bench, describe } from "vitest";
import * as ethers from "./gt-ethers.js";
import * as guilNative from "./gt-guil-native.js";
import * as guilWasm from "./gt-guil-wasm.js";
import * as viem from "./gt-viem.js";

describe("uint256.gt", () => {
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
