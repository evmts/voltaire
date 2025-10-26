import { bench, describe } from "vitest";
import * as guil from "./calculateCreateAddress/guil.js";
import * as ethers from "./calculateCreateAddress/ethers.js";
import * as viem from "./calculateCreateAddress/viem.js";

describe("address.calculateCreateAddress", () => {
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
