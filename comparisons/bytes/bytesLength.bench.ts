import { bench, describe } from "vitest";
import * as guil from "./bytesLength/guil.js";
import * as ethers from "./bytesLength/ethers.js";
import * as viem from "./bytesLength/viem.js";

describe("bytesLength", () => {
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
