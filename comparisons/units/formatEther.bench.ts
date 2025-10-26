import { bench, describe } from "vitest";
import * as guil from "./formatEther-guil.js";
import * as ethers from "./formatEther-ethers.js";
import * as viem from "./formatEther-viem.js";

describe("formatEther", () => {
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
