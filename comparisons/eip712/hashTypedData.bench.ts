import { bench, describe } from "vitest";
import * as ethers from "./hashTypedData.ethers.js";
import * as guilNative from "./hashTypedData.guil-native.js";
import * as guilWasm from "./hashTypedData.guil-wasm.js";
import * as viem from "./hashTypedData.viem.js";

describe("hashTypedData", () => {
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
