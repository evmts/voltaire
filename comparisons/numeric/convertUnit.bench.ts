import { bench, describe } from "vitest";
import * as ethers from "./convertUnit/ethers.js";
import * as guilNative from "./convertUnit/guil-native.js";
import * as guilWasm from "./convertUnit/guil-wasm.js";
import * as viem from "./convertUnit/viem.js";

describe("convertUnit", () => {
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
