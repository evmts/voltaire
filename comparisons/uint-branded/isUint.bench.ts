import { bench, describe } from "vitest";
import * as guil from "./isUint/guil.js";
import * as ethers from "./isUint/ethers.js";
import * as viem from "./isUint/viem.js";

describe("isUint", () => {
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
