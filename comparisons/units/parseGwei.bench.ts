import { bench, describe } from "vitest";
import * as guil from "./parseGwei-guil.js";
import * as ethers from "./parseGwei-ethers.js";
import * as viem from "./parseGwei-viem.js";

describe("parseGwei", () => {
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
