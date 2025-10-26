import { bench, describe } from "vitest";
import * as guil from "./parseEther-guil.js";
import * as ethers from "./parseEther-ethers.js";
import * as viem from "./parseEther-viem.js";

describe("parseEther", () => {
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
