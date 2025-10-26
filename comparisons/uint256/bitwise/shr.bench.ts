import { bench, describe } from "vitest";
import * as guil from "./shr-guil.js";
import * as ethers from "./shr-ethers.js";
import * as viem from "./shr-viem.js";

describe("uint256.shr", () => {
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
