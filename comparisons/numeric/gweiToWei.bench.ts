import { bench, describe } from "vitest";
import * as ethers from "./gweiToWei/ethers.js";
import * as guilNative from "./gweiToWei/guil-native.js";
import * as guilWasm from "./gweiToWei/guil-wasm.js";
import * as viem from "./gweiToWei/viem.js";

describe("gweiToWei", () => {
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
