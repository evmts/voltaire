import { bench, describe } from "vitest";
import * as ethers from "./calculateCreate2Address/ethers.js";
import * as guilNative from "./calculateCreate2Address/guil-native.js";
import * as guilWasm from "./calculateCreate2Address/guil-wasm.js";
import * as viem from "./calculateCreate2Address/viem.js";

describe("address.calculateCreate2Address", () => {
	bench("guil-native", () => {
		guilNative.main();
	});

	bench("guil-wasm", () => {
		guilWasm.main();
	});

	bench("ethers", () => {
		ethers.main();
	});

	bench("viem", () => {
		viem.main();
	});
});
