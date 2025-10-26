import { bench, describe } from "vitest";
import * as guil from "./u256ToHex/guil.js";
import * as ethers from "./u256ToHex/ethers.js";
import * as viem from "./u256ToHex/viem.js";

describe("u256ToHex", () => {
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
