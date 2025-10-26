import { bench, describe } from "vitest";
import * as guilNative from "./hexToU256/guil-native.js";
import * as guilWasm from "./hexToU256/guil-wasm.js";
import * as ethers from "./hexToU256/ethers.js";
import * as viem from "./hexToU256/viem.js";

describe("hexToU256", () => {
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
