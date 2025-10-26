import { bench, describe } from "vitest";
import * as guil from "./toBigInt-guil.js";
import * as ethers from "./toBigInt-ethers.js";
import * as viem from "./toBigInt-viem.js";

describe("uint256.toBigInt", () => {
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
