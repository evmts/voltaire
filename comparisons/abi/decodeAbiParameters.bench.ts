import { bench, describe } from "vitest";
import * as guilNative from "./decodeAbiParameters-guil-native.js";
import * as guilWasm from "./decodeAbiParameters-guil-wasm.js";
import * as ethers from "./decodeAbiParameters-ethers.js";
import * as viem from "./decodeAbiParameters-viem.js";

describe("decodeAbiParameters", () => {
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
