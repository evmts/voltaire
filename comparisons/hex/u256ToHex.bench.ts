import { bench, describe } from "vitest";
import * as ethers from "./u256ToHex/ethers.js";
import * as guilNative from "./u256ToHex/guil-native.js";
import * as guilWasm from "./u256ToHex/guil-wasm.js";
import * as viem from "./u256ToHex/viem.js";

describe("u256ToHex", () => {
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
