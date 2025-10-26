import { bench, describe } from "vitest";
import * as guil from "./compare-guil.js";
import * as ethers from "./compare-ethers.js";
import * as viem from "./compare-viem.js";

describe("uint256.compare", () => {
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
