import { bench, describe } from "vitest";
import * as ethers from "./constructor/ethers.js";
import * as guilNative from "./constructor/guil-native.js";
import * as guilWasm from "./constructor/guil-wasm.js";
import * as viem from "./constructor/viem.js";

describe("Hash32 constructor", () => {
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
