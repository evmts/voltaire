import { bench, describe } from "vitest";
import * as ethers from "./publicKeyToAddress/ethers.js";
import * as guilNative from "./publicKeyToAddress/guil-native.js";
import * as guilWasm from "./publicKeyToAddress/guil-wasm.js";
import * as viem from "./publicKeyToAddress/viem.js";

describe("wallet.publicKeyToAddress", () => {
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
