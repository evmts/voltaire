import { bench, describe } from "vitest";
import * as guilNative from "./calculateCreateAddress/guil-native.js";
import * as guilWasm from "./calculateCreateAddress/guil-wasm.js";
import * as ethers from "./calculateCreateAddress/ethers.js";
import * as viem from "./calculateCreateAddress/viem.js";

describe("address.calculateCreateAddress", () => {
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
