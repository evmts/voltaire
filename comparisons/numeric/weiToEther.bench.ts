import { bench, describe } from "vitest";
import * as ethers from "./weiToEther/ethers.js";
import * as guilNative from "./weiToEther/guil-native.js";
import * as guilWasm from "./weiToEther/guil-wasm.js";
import * as viem from "./weiToEther/viem.js";

describe("weiToEther", () => {
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
