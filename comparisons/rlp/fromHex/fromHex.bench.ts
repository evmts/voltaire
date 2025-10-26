import { bench, describe } from "vitest";
import * as guilNative from "./guil-native.js";
import * as guilWasm from "./guil-wasm.js";
import * as ethers from "./ethers.js";
import * as viem from "./viem.js";

describe("rlp fromHex", () => {
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
