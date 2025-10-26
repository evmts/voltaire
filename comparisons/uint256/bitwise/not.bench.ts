import { bench, describe } from "vitest";
import * as guil from "./not-guil.js";
import * as ethers from "./not-ethers.js";
import * as viem from "./not-viem.js";

describe("uint256.not", () => {
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
