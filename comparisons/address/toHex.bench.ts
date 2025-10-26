import { bench, describe } from "vitest";
import * as ethers from "./toHex/ethers.js";
import * as guilNative from "./toHex/guil-native.js";
import * as guilWasm from "./toHex/guil-wasm.js";
import * as viem from "./toHex/viem.js";

describe("address.toHex", () => {
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
