import { bench, describe } from "vitest";
import * as guil from "./Bytes/guil.js";
import * as ethers from "./Bytes/ethers.js";
import * as viem from "./Bytes/viem.js";

describe("Bytes constructor", () => {
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
