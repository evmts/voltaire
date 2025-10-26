import { bench, describe } from "vitest";
import * as ethers from "./getAbiItem-ethers.js";
import * as guilNative from "./getAbiItem-guil-native.js";
import * as guilWasm from "./getAbiItem-guil-wasm.js";
import * as viem from "./getAbiItem-viem.js";

describe("getAbiItem", () => {
	bench("guil-native (fallback to viem)", () => {
		guilNative.main();
	});

	bench("guil-wasm (fallback to viem)", () => {
		guilWasm.main();
	});

	bench("ethers", () => {
		ethers.main();
	});

	bench("viem", () => {
		viem.main();
	});
});
