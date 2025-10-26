import { bench, describe } from "vitest";
import * as guilNative from "./div-guil-native.js";
import * as guilWasm from "./div-guil-wasm.js";
import * as ethers from "./div-ethers.js";
import * as viem from "./div-viem.js";

describe("uint256.div", () => {
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
