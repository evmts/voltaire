import { bench, describe } from "vitest";
import * as guil from "./guil.js";
import * as ethers from "./ethers.js";
import * as viem from "./viem.js";

describe("keccak256", () => {
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
