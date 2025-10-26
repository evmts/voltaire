import { bench, describe } from "vitest";
import * as guil from "./sub-guil.js";
import * as ethers from "./sub-ethers.js";
import * as viem from "./sub-viem.js";

describe("uint256.sub", () => {
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
