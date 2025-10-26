import { bench, describe } from "vitest";
import * as guil from "./sliceBytes/guil.js";
import * as ethers from "./sliceBytes/ethers.js";
import * as viem from "./sliceBytes/viem.js";

describe("sliceBytes", () => {
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
