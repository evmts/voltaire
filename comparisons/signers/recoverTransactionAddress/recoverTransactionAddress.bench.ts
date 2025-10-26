import { bench, describe } from "vitest";
import * as guil from "./guil.js";
import * as ethers from "./ethers.js";
import * as viem from "./viem.js";

describe("recoverTransactionAddress", () => {
	bench("guil", async () => {
		await guil.main();
	});

	bench("ethers", async () => {
		await ethers.main();
	});

	bench("viem", async () => {
		await viem.main();
	});
});
