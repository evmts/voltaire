import { bench, describe } from "vitest";
import * as guil from "./toBeArray/guil.js";
import * as ethers from "./toBeArray/ethers.js";
import * as viem from "./toBeArray/viem.js";

describe("toBeArray", () => {
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
