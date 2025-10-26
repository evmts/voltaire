import { bench, describe } from "vitest";
import * as guilNative from "./bytesToHex/guil-native.js";
import * as guilWasm from "./bytesToHex/guil-wasm.js";
import * as ethers from "./bytesToHex/ethers.js";
import * as viem from "./bytesToHex/viem.js";

describe("bytesToHex", () => {
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
