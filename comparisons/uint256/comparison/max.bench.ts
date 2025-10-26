import { bench, describe } from "vitest";
import * as guil from "./max-guil.js";
import * as ethers from "./max-ethers.js";
import * as viem from "./max-viem.js";

describe("uint256.max", () => {
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
