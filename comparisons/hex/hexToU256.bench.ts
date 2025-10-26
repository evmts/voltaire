import { bench, describe } from "vitest";
import * as guil from "./hexToU256/guil.js";
import * as ethers from "./hexToU256/ethers.js";
import * as viem from "./hexToU256/viem.js";

describe("hexToU256", () => {
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
