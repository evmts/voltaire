import { bench, describe } from "vitest";
import * as guil from "./bytesToUint8Array/guil.js";
import * as ethers from "./bytesToUint8Array/ethers.js";
import * as viem from "./bytesToUint8Array/viem.js";

describe("bytesToUint8Array", () => {
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
