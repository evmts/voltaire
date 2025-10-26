import { bench, describe } from "vitest";
import * as guil from "./encodeAbiParameters-guil.js";
import * as ethers from "./encodeAbiParameters-ethers.js";
import * as viem from "./encodeAbiParameters-viem.js";

describe("encodeAbiParameters", () => {
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
