import { bench, describe } from "vitest";
import * as guil from "./parseUnits-guil.js";
import * as ethers from "./parseUnits-ethers.js";
import * as viem from "./parseUnits-viem.js";

describe("parseUnits", () => {
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
