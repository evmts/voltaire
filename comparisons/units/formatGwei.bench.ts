import { bench, describe } from "vitest";
import * as guil from "./formatGwei-guil.js";
import * as ethers from "./formatGwei-ethers.js";
import * as viem from "./formatGwei-viem.js";

describe("formatGwei", () => {
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
