import { bench, describe } from "vitest";
import * as guil from "./div-guil.js";
import * as ethers from "./div-ethers.js";
import * as viem from "./div-viem.js";

describe("uint256.div", () => {
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
