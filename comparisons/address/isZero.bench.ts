import { bench, describe } from "vitest";
import * as guilNative from "./isZero/guil-native.js";
import * as guilWasm from "./isZero/guil-wasm.js";
import * as ethers from "./isZero/ethers.js";
import * as viem from "./isZero/viem.js";

describe("address.isZero", () => {
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
