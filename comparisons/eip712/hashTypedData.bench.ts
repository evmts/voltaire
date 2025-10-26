import { bench, describe } from "vitest";
import * as guil from "./hashTypedData.guil.js";
import * as ethers from "./hashTypedData.ethers.js";
import * as viem from "./hashTypedData.viem.js";

describe("hashTypedData", () => {
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
