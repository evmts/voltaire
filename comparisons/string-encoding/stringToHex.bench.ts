import { bench, describe } from "vitest";
import * as guilNative from "./stringToHex/guil-native.js";
import * as guilWasm from "./stringToHex/guil-wasm.js";
import * as ethers from "./stringToHex/ethers.js";
import * as viem from "./stringToHex/viem.js";

describe("stringToHex", () => {
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
