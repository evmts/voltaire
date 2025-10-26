import { bench, describe } from "vitest";
import * as guil from "./concatBytes/guil.js";
import * as ethers from "./concatBytes/ethers.js";
import * as viem from "./concatBytes/viem.js";

describe("concatBytes", () => {
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
