import { bench, describe } from "vitest";
import * as guil from "./decodeFunctionData-guil.js";
import * as ethers from "./decodeFunctionData-ethers.js";
import * as viem from "./decodeFunctionData-viem.js";

describe("decodeFunctionData", () => {
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
