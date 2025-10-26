import { bench, describe } from "vitest";
import * as guil from "./guil.js";

describe("isBytecodeBoundary", () => {
	bench("guil", () => {
		guil.main();
	});

	// Note: ethers and viem do not provide bytecode boundary checking utilities
	// Only guil is benchmarked for this functionality
});
