import { bench, describe } from "vitest";
import * as guil from "./toBytes-guil.js";
import * as ethers from "./toBytes-ethers.js";
import * as viem from "./toBytes-viem.js";

describe("uint256.toBytes", () => {
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
