import { bench, describe } from "vitest";
import * as ethers from "./parseAbiItem-ethers.js";
import * as guilNative from "./parseAbiItem-guil-native.js";
import * as guilWasm from "./parseAbiItem-guil-wasm.js";
import * as viem from "./parseAbiItem-viem.js";

describe("parseAbiItem", () => {
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
