import { bench, describe } from "vitest";
import * as guilNative from "./uintToBigInt/guil-native.js";
import * as guilWasm from "./uintToBigInt/guil-wasm.js";
import * as ethers from "./uintToBigInt/ethers.js";
import * as viem from "./uintToBigInt/viem.js";

describe("uintToBigInt", () => {
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
