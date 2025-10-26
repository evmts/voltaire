import { bench, describe } from "vitest";
import * as guil from "./pow-guil.js";
import * as ethers from "./pow-ethers.js";
import * as viem from "./pow-viem.js";

describe("uint256.pow", () => {
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
