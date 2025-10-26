import { bench, describe } from "vitest";
import * as guil from "./byteToNumber/guil.js";
import * as ethers from "./byteToNumber/ethers.js";
import * as viem from "./byteToNumber/viem.js";

describe("byteToNumber", () => {
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
