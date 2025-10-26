import { bench, describe } from "vitest";
import * as guil from "./calculateCreate2Address/guil.js";
import * as ethers from "./calculateCreate2Address/ethers.js";
import * as viem from "./calculateCreate2Address/viem.js";

describe("address.calculateCreate2Address", () => {
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
