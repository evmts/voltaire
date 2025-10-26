import { bench, describe } from "vitest";
import * as ethers from "./labelhash/ethers.js";
import * as guil from "./labelhash/guil.js";
import * as viem from "./labelhash/viem.js";

describe("labelhash", () => {
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
