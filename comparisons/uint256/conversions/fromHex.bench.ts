import { bench, describe } from "vitest";
import * as guilNative from "./fromHex-guil-native.js";
import * as guilWasm from "./fromHex-guil-wasm.js";
import * as ethers from "./fromHex-ethers.js";
import * as viem from "./fromHex-viem.js";

describe("uint256.fromHex", () => {
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
