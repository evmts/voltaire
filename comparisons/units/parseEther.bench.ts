import { bench, describe } from "vitest";
import * as ethers from "./parseEther-ethers.js";
import * as guilNative from "./parseEther-guil-native.js";
import * as guilWasm from "./parseEther-guil-wasm.js";
import * as viem from "./parseEther-viem.js";

describe("parseEther", () => {
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
