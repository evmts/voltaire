import { bench, describe } from "vitest";
import * as guil from "./eq-guil.js";
import * as ethers from "./eq-ethers.js";
import * as viem from "./eq-viem.js";

describe("uint256.eq", () => {
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
