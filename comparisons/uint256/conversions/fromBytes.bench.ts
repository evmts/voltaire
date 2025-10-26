import { bench, describe } from "vitest";
import * as guil from "./fromBytes-guil.js";
import * as ethers from "./fromBytes-ethers.js";
import * as viem from "./fromBytes-viem.js";

describe("uint256.fromBytes", () => {
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
