import { bench, describe } from "vitest";
import * as guil from "./xor-guil.js";
import * as ethers from "./xor-ethers.js";
import * as viem from "./xor-viem.js";

describe("uint256.xor", () => {
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
