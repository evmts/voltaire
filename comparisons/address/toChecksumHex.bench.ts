import { bench, describe } from "vitest";
import * as guil from "./toChecksumHex/guil.js";
import * as ethers from "./toChecksumHex/ethers.js";
import * as viem from "./toChecksumHex/viem.js";

describe("address.toChecksumHex", () => {
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
