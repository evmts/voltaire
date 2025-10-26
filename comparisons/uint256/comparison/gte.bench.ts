import { bench, describe } from "vitest";
import * as guil from "./gte-guil.js";
import * as ethers from "./gte-ethers.js";
import * as viem from "./gte-viem.js";

describe("uint256.gte", () => {
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
