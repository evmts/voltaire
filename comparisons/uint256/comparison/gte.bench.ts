import { bench, describe } from "vitest";
import * as ethers from "./gte-ethers.js";
import * as guilNative from "./gte-guil-native.js";
import * as guilWasm from "./gte-guil-wasm.js";
import * as viem from "./gte-viem.js";

describe("uint256.gte", () => {
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
