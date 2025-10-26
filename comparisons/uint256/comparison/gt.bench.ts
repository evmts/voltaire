import { bench, describe } from "vitest";
import * as guil from "./gt-guil.js";
import * as ethers from "./gt-ethers.js";
import * as viem from "./gt-viem.js";

describe("uint256.gt", () => {
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
