import { bench, describe } from "vitest";
import * as ethers from "./toQuantity/ethers.js";
import * as guil from "./toQuantity/guil.js";
import * as viem from "./toQuantity/viem.js";

describe("toQuantity", () => {
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
