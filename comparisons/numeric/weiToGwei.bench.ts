import { bench, describe } from "vitest";
import * as ethers from "./weiToGwei/ethers.js";
import * as guilNative from "./weiToGwei/guil-native.js";
import * as guilWasm from "./weiToGwei/guil-wasm.js";
import * as viem from "./weiToGwei/viem.js";

describe("weiToGwei", () => {
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
