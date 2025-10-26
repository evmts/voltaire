import { bench, describe } from "vitest";
import * as guil from "./lt-guil.js";
import * as ethers from "./lt-ethers.js";
import * as viem from "./lt-viem.js";

describe("uint256.lt", () => {
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
