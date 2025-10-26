import { bench, describe } from "vitest";
import * as guil from "./mul-guil.js";
import * as ethers from "./mul-ethers.js";
import * as viem from "./mul-viem.js";

describe("uint256.mul", () => {
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
