import { bench, describe } from "vitest";
import * as guil from "./guil.js";

describe("validateBytecode", () => {
	bench("guil", () => {
		guil.main();
	});

	// Note: ethers and viem do not provide bytecode validation utilities
	// Only guil is benchmarked for this functionality
});
