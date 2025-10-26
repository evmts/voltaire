import { bench, describe } from "vitest";
import * as guil from "./Byte/guil.js";
import * as ethers from "./Byte/ethers.js";
import * as viem from "./Byte/viem.js";

describe("Byte constructor", () => {
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
