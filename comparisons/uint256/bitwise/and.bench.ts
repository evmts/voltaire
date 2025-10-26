import { bench, describe } from "vitest";
import * as guil from "./and-guil.js";
import * as ethers from "./and-ethers.js";
import * as viem from "./and-viem.js";

describe("uint256.and", () => {
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
