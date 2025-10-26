import { bench, describe } from "vitest";
import * as guilNative from "./guil-native.js";
import * as guilWasm from "./guil-wasm.js";

describe("isBytecodeBoundary", () => {
	bench("guil-native", () => {
		guilNative.main();
	});

	bench("guil-wasm", () => {
		guilWasm.main();
	});

	// Note: ethers and viem do not provide bytecode boundary checking utilities
	// Only guil is benchmarked for this functionality
});
