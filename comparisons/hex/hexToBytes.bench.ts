import { bench, describe } from "vitest";
import * as guil from "./hexToBytes/guil.js";
import * as ethers from "./hexToBytes/ethers.js";
import * as viem from "./hexToBytes/viem.js";

describe("hexToBytes", () => {
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
