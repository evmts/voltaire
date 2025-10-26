import { bench, describe } from "vitest";
import * as guil from "./fill/guil.js";
import * as ethers from "./fill/ethers.js";
import * as viem from "./fill/viem.js";

describe("Hash32 fill", () => {
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
