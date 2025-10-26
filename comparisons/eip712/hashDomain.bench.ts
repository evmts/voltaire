import { bench, describe } from "vitest";
import * as guil from "./hashDomain.guil.js";
import * as ethers from "./hashDomain.ethers.js";
import * as viem from "./hashDomain.viem.js";

describe("hashDomain", () => {
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
