import { bench, describe } from "vitest";
import * as ethers from "./trimRight/ethers.js";
import * as guilNative from "./trimRight/guil-native.js";
import * as guilWasm from "./trimRight/guil-wasm.js";
import * as viem from "./trimRight/viem.js";

describe("trimRight", () => {
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
