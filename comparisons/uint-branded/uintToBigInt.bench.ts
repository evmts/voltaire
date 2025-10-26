import { bench, describe } from "vitest";
import * as guil from "./uintToBigInt/guil.js";
import * as ethers from "./uintToBigInt/ethers.js";
import * as viem from "./uintToBigInt/viem.js";

describe("uintToBigInt", () => {
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
