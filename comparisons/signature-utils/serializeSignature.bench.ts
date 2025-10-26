import { bench, describe } from "vitest";
import * as guil from "./serializeSignature/guil.js";
import * as ethers from "./serializeSignature/ethers.js";
import * as viem from "./serializeSignature/viem.js";

describe("serializeSignature", () => {
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
