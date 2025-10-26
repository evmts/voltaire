import { bench, describe } from "vitest";
import * as guilNative from "./pow-guil-native.js";
import * as guilWasm from "./pow-guil-wasm.js";
import * as ethers from "./pow-ethers.js";
import * as viem from "./pow-viem.js";

describe("uint256.pow", () => {
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
