import { bench, describe } from "vitest";
import * as guilNative from "./generatePrivateKey/guil-native.js";
import * as guilWasm from "./generatePrivateKey/guil-wasm.js";
import * as ethers from "./generatePrivateKey/ethers.js";
import * as viem from "./generatePrivateKey/viem.js";

describe("wallet.generatePrivateKey", () => {
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
