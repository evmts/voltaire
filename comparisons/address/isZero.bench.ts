import { bench, describe } from "vitest";
import * as guil from "./isZero/guil.js";
import * as ethers from "./isZero/ethers.js";
import * as viem from "./isZero/viem.js";

describe("address.isZero", () => {
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
