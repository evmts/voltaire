import { bench, describe } from "vitest";
import * as guilNative from "./privateKeyToPublicKey/guil-native.js";
import * as guilWasm from "./privateKeyToPublicKey/guil-wasm.js";
import * as ethers from "./privateKeyToPublicKey/ethers.js";
import * as viem from "./privateKeyToPublicKey/viem.js";

describe("wallet.privateKeyToPublicKey", () => {
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
