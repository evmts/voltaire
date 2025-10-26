import { bench, describe } from "vitest";
import * as guil from "./encodeFunctionData-guil.js";
import * as ethers from "./encodeFunctionData-ethers.js";
import * as viem from "./encodeFunctionData-viem.js";

describe("encodeFunctionData", () => {
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
