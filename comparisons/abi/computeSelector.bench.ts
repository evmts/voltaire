import { bench, describe } from "vitest";
import * as ethers from "./computeSelector-ethers.js";
import * as guilNative from "./computeSelector-guil-native.js";
import * as guilWasm from "./computeSelector-guil-wasm.js";
import * as viem from "./computeSelector-viem.js";

describe("computeSelector", () => {
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
