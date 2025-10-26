import { bench, describe } from "vitest";
import * as guil from "./toUint8Array/guil.js";
import * as ethers from "./toUint8Array/ethers.js";
import * as viem from "./toUint8Array/viem.js";

describe("Hash32 toUint8Array", () => {
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
