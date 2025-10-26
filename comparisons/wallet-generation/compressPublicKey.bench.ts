import { bench, describe } from "vitest";
import * as guilNative from "./compressPublicKey/guil-native.js";
import * as guilWasm from "./compressPublicKey/guil-wasm.js";
import * as ethers from "./compressPublicKey/ethers.js";
import * as viem from "./compressPublicKey/viem.js";

describe("wallet.compressPublicKey", () => {
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
