import { bench, describe } from "vitest";
import * as guil from "./or-guil.js";
import * as ethers from "./or-ethers.js";
import * as viem from "./or-viem.js";

describe("uint256.or", () => {
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
