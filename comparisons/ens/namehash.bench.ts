import { bench, describe } from "vitest";
import * as guil from "./namehash/guil.js";
import * as ethers from "./namehash/ethers.js";
import * as viem from "./namehash/viem.js";

describe("namehash", () => {
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
