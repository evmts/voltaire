import { bench, describe } from "vitest";
import * as ethers from "./encodeAbiParameters-ethers.js";
import * as guilNative from "./encodeAbiParameters-guil-native.js";
import * as guilWasm from "./encodeAbiParameters-guil-wasm.js";
import * as viem from "./encodeAbiParameters-viem.js";

describe("encodeAbiParameters", () => {
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
