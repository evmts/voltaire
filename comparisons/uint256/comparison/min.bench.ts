import { bench, describe } from "vitest";
import * as guil from "./min-guil.js";
import * as ethers from "./min-ethers.js";
import * as viem from "./min-viem.js";

describe("uint256.min", () => {
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
