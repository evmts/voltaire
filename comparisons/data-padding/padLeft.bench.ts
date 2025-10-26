import { bench, describe } from "vitest";
import * as ethers from "./padLeft/ethers.js";
import * as guilNative from "./padLeft/guil-native.js";
import * as guilWasm from "./padLeft/guil-wasm.js";
import * as viem from "./padLeft/viem.js";

describe("padLeft", () => {
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
