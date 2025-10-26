import { bench, describe } from "vitest";
import * as ethers from "./toBeHex/ethers.js";
import * as guil from "./toBeHex/guil.js";
import * as viem from "./toBeHex/viem.js";

describe("toBeHex", () => {
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
