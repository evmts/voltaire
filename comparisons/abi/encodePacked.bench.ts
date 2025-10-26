import { bench, describe } from "vitest";
import * as ethers from "./encodePacked-ethers.js";
import * as guilNative from "./encodePacked-guil-native.js";
import * as guilWasm from "./encodePacked-guil-wasm.js";
import * as viem from "./encodePacked-viem.js";

describe("encodePacked", () => {
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
