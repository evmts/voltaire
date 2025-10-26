import { bench, describe } from "vitest";
import * as guil from "./guil.js";
// import * as ethers from './ethers.js'; // EIP-7702 not supported yet
import * as viem from "./viem.js";

describe("serializeEip7702", () => {
	bench("guil", () => {
		guil.main();
	});

	// Ethers does not support EIP-7702 yet
	// bench('ethers', () => {
	// 	ethers.main();
	// });

	bench("viem", () => {
		viem.main();
	});
});
