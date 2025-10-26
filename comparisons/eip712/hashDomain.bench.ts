import { bench, describe } from "vitest";
import * as ethers from "./hashDomain.ethers.js";
import * as guilNative from "./hashDomain.guil-native.js";
import * as guilWasm from "./hashDomain.guil-wasm.js";
import * as viem from "./hashDomain.viem.js";

describe("hashDomain", () => {
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
