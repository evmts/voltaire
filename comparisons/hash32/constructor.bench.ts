import { bench, describe } from "vitest";
import * as guil from "./constructor/guil.js";
import * as ethers from "./constructor/ethers.js";
import * as viem from "./constructor/viem.js";

describe("Hash32 constructor", () => {
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
