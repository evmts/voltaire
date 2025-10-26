import { bench, describe } from "vitest";
import * as guil from "./lte-guil.js";
import * as ethers from "./lte-ethers.js";
import * as viem from "./lte-viem.js";

describe("uint256.lte", () => {
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
