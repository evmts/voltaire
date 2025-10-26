import { bench, describe } from "vitest";
import * as guil from "./fromHex-guil.js";
import * as ethers from "./fromHex-ethers.js";
import * as viem from "./fromHex-viem.js";

describe("uint256.fromHex", () => {
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
