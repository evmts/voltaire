import { bench, describe } from "vitest";
import * as guil from "./equals/guil.js";
import * as ethers from "./equals/ethers.js";
import * as viem from "./equals/viem.js";

describe("address.equals", () => {
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
