import { bench, describe } from "vitest";
import * as guil from "./fromBigInt-guil.js";
import * as ethers from "./fromBigInt-ethers.js";
import * as viem from "./fromBigInt-viem.js";

describe("uint256.fromBigInt", () => {
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
