import { bench, describe } from "vitest";
import * as guil from "./typeGuard/guil.js";
import * as ethers from "./typeGuard/ethers.js";
import * as viem from "./typeGuard/viem.js";

describe("Hash32 typeGuard", () => {
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
