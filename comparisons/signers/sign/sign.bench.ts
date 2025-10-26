import { bench, describe } from "vitest";
import * as guilNative from "./guil-native.js";
import * as guilWasm from "./guil-wasm.js";
import * as ethers from "./ethers.js";
import * as viem from "./viem.js";

describe("sign", () => {
	bench("guil-native", async () => {
		await guilNative.main();
	});

	bench("guil-wasm", async () => {
		await guilWasm.main();
	});

	bench("ethers", async () => {
		await ethers.main();
	});

	bench("viem", async () => {
		await viem.main();
	});
});
