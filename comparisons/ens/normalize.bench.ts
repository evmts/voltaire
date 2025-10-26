import { bench, describe } from "vitest";
import * as guil from "./normalize/guil.js";
import * as ethers from "./normalize/ethers.js";
import * as viem from "./normalize/viem.js";

describe("normalize", () => {
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
