import { bench, describe } from "vitest";
import * as guil from "./decodeAbiParameters-guil.js";
import * as ethers from "./decodeAbiParameters-ethers.js";
import * as viem from "./decodeAbiParameters-viem.js";

describe("decodeAbiParameters", () => {
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
