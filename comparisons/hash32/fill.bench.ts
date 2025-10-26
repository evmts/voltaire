import { bench, describe } from "vitest";
import * as guilNative from "./fill/guil-native.js";
import * as guilWasm from "./fill/guil-wasm.js";
import * as ethers from "./fill/ethers.js";
import * as viem from "./fill/viem.js";

describe("Hash32 fill", () => {
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
