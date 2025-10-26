import { bench, describe } from "vitest";
import * as guilNative from "./toUint8Array/guil-native.js";
import * as guilWasm from "./toUint8Array/guil-wasm.js";
import * as ethers from "./toUint8Array/ethers.js";
import * as viem from "./toUint8Array/viem.js";

describe("Hash32 toUint8Array", () => {
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
