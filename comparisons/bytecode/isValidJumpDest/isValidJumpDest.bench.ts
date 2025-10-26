import { bench, describe } from "vitest";
import * as guil from "./guil.js";

describe("isValidJumpDest", () => {
	bench("guil", () => {
		guil.main();
	});

	// Note: ethers and viem do not provide JUMPDEST validation utilities
	// Only guil is benchmarked for this functionality
});
