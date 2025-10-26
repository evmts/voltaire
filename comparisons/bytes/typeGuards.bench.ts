import { bench, describe } from "vitest";
import * as guil from "./typeGuards/guil.js";
import * as ethers from "./typeGuards/ethers.js";
import * as viem from "./typeGuards/viem.js";

describe("type guards (isBytes, isByte)", () => {
	bench("guil", () => {
		guil.main();
	});

	bench("ethers", () => {
		ethers.main();
	});

	bench("viem", () => {
		viem.main();
	});
});
