import { bench, describe } from "vitest";
import * as guil from "./mod-guil.js";
import * as ethers from "./mod-ethers.js";
import * as viem from "./mod-viem.js";

describe("uint256.mod", () => {
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
