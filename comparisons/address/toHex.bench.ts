import { bench, describe } from "vitest";
import * as guil from "./toHex/guil.js";
import * as ethers from "./toHex/ethers.js";
import * as viem from "./toHex/viem.js";

describe("address.toHex", () => {
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
