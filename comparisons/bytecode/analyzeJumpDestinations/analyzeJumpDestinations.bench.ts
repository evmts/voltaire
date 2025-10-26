import { bench, describe } from "vitest";
import * as guil from "./guil.js";

describe("analyzeJumpDestinations", () => {
	bench("guil", () => {
		guil.main();
	});

	// Note: ethers and viem do not provide bytecode analysis utilities
	// Only guil is benchmarked for this functionality
});
