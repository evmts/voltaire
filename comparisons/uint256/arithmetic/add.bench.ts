import { bench, describe } from "vitest";
import * as guil from "./add-guil.js";
import * as ethers from "./add-ethers.js";
import * as viem from "./add-viem.js";

describe("uint256.add", () => {
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
