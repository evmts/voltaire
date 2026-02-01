import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("ChainId constants", () => {
	describe("MAINNET", () => {
		it("has value 1", () => {
			expect(ChainId.MAINNET).toBe(1);
		});
	});

	describe("GOERLI", () => {
		it("has value 5", () => {
			expect(ChainId.GOERLI).toBe(5);
		});
	});

	describe("SEPOLIA", () => {
		it("has value 11155111", () => {
			expect(ChainId.SEPOLIA).toBe(11155111);
		});
	});

	describe("HOLESKY", () => {
		it("has value 17000", () => {
			expect(ChainId.HOLESKY).toBe(17000);
		});
	});

	describe("OPTIMISM", () => {
		it("has value 10", () => {
			expect(ChainId.OPTIMISM).toBe(10);
		});
	});

	describe("ARBITRUM", () => {
		it("has value 42161", () => {
			expect(ChainId.ARBITRUM).toBe(42161);
		});
	});

	describe("BASE", () => {
		it("has value 8453", () => {
			expect(ChainId.BASE).toBe(8453);
		});
	});

	describe("POLYGON", () => {
		it("has value 137", () => {
			expect(ChainId.POLYGON).toBe(137);
		});
	});
});
