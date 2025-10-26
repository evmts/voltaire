import { bench, describe } from "vitest";
import * as guilNative from "./bytesToUint8Array/guil-native.js";
import * as guilWasm from "./bytesToUint8Array/guil-wasm.js";
import * as ethers from "./bytesToUint8Array/ethers.js";
import * as viem from "./bytesToUint8Array/viem.js";

describe("bytesToUint8Array", () => {
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
