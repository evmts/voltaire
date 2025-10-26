import { bench, describe } from "vitest";
import * as guilNative from "./guil-native.js";
import * as guilWasm from "./guil-wasm.js";

describe("validateBytecode", () => {
	bench("guil-native", () => {
		guilNative.main();
	});

	bench("guil-wasm", () => {
		guilWasm.main();
	});

	// Note: ethers and viem do not provide bytecode validation utilities
	// Only guil is benchmarked for this functionality
});
