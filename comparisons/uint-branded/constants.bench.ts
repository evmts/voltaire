import { bench, describe } from "vitest";
import * as guil from "./constants/guil.js";
import * as ethers from "./constants/ethers.js";
import * as viem from "./constants/viem.js";

describe("constants", () => {
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
