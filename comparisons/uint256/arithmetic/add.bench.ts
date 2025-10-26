import { bench, describe } from "vitest";
import * as ethers from "./add-ethers.js";
import * as guilNative from "./add-guil-native.js";
import * as guilWasm from "./add-guil-wasm.js";
import * as viem from "./add-viem.js";

describe("uint256.add", () => {
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
