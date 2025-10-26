import { bench, describe } from "vitest";
import * as guilNative from "./parseAbi-guil-native.js";
import * as guilWasm from "./parseAbi-guil-wasm.js";
import * as ethers from "./parseAbi-ethers.js";
import * as viem from "./parseAbi-viem.js";

describe("parseAbi", () => {
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
