import { bench, describe } from "vitest";
import * as ethers from "./bytesLength/ethers.js";
import * as guilNative from "./bytesLength/guil-native.js";
import * as guilWasm from "./bytesLength/guil-wasm.js";
import * as viem from "./bytesLength/viem.js";

describe("bytesLength", () => {
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
