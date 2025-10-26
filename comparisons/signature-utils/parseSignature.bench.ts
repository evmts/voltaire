import { bench, describe } from "vitest";
import * as guil from "./parseSignature/guil.js";
import * as ethers from "./parseSignature/ethers.js";
import * as viem from "./parseSignature/viem.js";

describe("parseSignature", () => {
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
