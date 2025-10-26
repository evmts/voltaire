import { bench, describe } from "vitest";
import * as guil from "./bytesToHex/guil.js";
import * as ethers from "./bytesToHex/ethers.js";
import * as viem from "./bytesToHex/viem.js";

describe("bytesToHex", () => {
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
