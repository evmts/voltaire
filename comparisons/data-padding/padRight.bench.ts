import { bench, describe } from "vitest";
import * as ethers from "./padRight/ethers.js";
import * as guilNative from "./padRight/guil-native.js";
import * as guilWasm from "./padRight/guil-wasm.js";
import * as viem from "./padRight/viem.js";

describe("padRight", () => {
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
