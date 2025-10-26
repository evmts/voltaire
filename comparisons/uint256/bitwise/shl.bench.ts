import { bench, describe } from "vitest";
import * as guil from "./shl-guil.js";
import * as ethers from "./shl-ethers.js";
import * as viem from "./shl-viem.js";

describe("uint256.shl", () => {
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
