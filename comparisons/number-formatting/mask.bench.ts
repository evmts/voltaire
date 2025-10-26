import { bench, describe } from "vitest";
import * as ethers from "./mask/ethers.js";
import * as guil from "./mask/guil.js";
import * as viem from "./mask/viem.js";

describe("mask", () => {
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
