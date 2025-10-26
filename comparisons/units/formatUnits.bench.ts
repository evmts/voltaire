import { bench, describe } from "vitest";
import * as guil from "./formatUnits-guil.js";
import * as ethers from "./formatUnits-ethers.js";
import * as viem from "./formatUnits-viem.js";

describe("formatUnits", () => {
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
