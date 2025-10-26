import { bench, describe } from "vitest";
import * as guilNative from "./serializeSignature/guil-native.js";
import * as guilWasm from "./serializeSignature/guil-wasm.js";
import * as ethers from "./serializeSignature/ethers.js";
import * as viem from "./serializeSignature/viem.js";

describe("serializeSignature", () => {
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
