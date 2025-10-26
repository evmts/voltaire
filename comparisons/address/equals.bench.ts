import { bench, describe } from "vitest";
import * as guilNative from "./equals/guil-native.js";
import * as guilWasm from "./equals/guil-wasm.js";
import * as ethers from "./equals/ethers.js";
import * as viem from "./equals/viem.js";

describe("address.equals", () => {
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
