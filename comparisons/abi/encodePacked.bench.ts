import { bench, describe } from "vitest";
import * as guil from "./encodePacked-guil.js";
import * as ethers from "./encodePacked-ethers.js";
import * as viem from "./encodePacked-viem.js";

describe("encodePacked", () => {
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
