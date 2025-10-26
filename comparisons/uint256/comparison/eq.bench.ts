import { bench, describe } from "vitest";
import * as guilNative from "./eq-guil-native.js";
import * as guilWasm from "./eq-guil-wasm.js";
import * as ethers from "./eq-ethers.js";
import * as viem from "./eq-viem.js";

describe("uint256.eq", () => {
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
