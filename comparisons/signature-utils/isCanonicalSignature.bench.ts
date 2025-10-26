import { bench, describe } from "vitest";
import * as guil from "./isCanonicalSignature/guil.js";
import * as ethers from "./isCanonicalSignature/ethers.js";
import * as viem from "./isCanonicalSignature/viem.js";

describe("isCanonicalSignature", () => {
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
