import { bench, describe } from "vitest";
import * as ethers from "./toChecksumHex/ethers.js";
import * as guilNative from "./toChecksumHex/guil-native.js";
import * as guilWasm from "./toChecksumHex/guil-wasm.js";
import * as viem from "./toChecksumHex/viem.js";

describe("address.toChecksumHex", () => {
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
