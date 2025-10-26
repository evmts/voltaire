import { bench, describe } from "vitest";
import * as guil from "./computeSelector-guil.js";
import * as ethers from "./computeSelector-ethers.js";
import * as viem from "./computeSelector-viem.js";

describe("computeSelector", () => {
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
