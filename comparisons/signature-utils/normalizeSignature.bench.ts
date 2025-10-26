import { bench, describe } from "vitest";
import * as guil from "./normalizeSignature/guil.js";
import * as ethers from "./normalizeSignature/ethers.js";
import * as viem from "./normalizeSignature/viem.js";

describe("normalizeSignature", () => {
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
