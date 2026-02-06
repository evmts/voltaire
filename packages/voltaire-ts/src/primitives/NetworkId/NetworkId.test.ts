import { describe, expect, it } from "vitest";
import * as NetworkId from "./index.js";

describe("NetworkId", () => {
	describe("from", () => {
		it("creates NetworkId from valid number", () => {
			const netId = NetworkId.from(1);
			expect(netId).toBe(1);
		});

		it("accepts zero", () => {
			const netId = NetworkId.from(0);
			expect(netId).toBe(0);
		});

		it("accepts large network IDs", () => {
			const netId = NetworkId.from(11155111);
			expect(netId).toBe(11155111);
		});

		it("throws on negative number", () => {
			expect(() => NetworkId.from(-1)).toThrow(
				"Network ID must be non-negative integer",
			);
		});

		it("throws on non-integer", () => {
			expect(() => NetworkId.from(1.5)).toThrow(
				"Network ID must be non-negative integer",
			);
		});
	});

	describe("toNumber", () => {
		it("converts NetworkId to number", () => {
			const netId = NetworkId.from(1);
			expect(NetworkId.toNumber(netId)).toBe(1);
		});
	});

	describe("equals", () => {
		it("returns true for equal network IDs", () => {
			const netId1 = NetworkId.from(1);
			const netId2 = NetworkId.from(1);
			expect(NetworkId.equals(netId1, netId2)).toBe(true);
		});

		it("returns false for different network IDs", () => {
			const netId1 = NetworkId.from(1);
			const netId2 = NetworkId.from(5);
			expect(NetworkId.equals(netId1, netId2)).toBe(false);
		});
	});

	describe("constants", () => {
		it("exports common network IDs", () => {
			expect(NetworkId.MAINNET).toBe(1);
			expect(NetworkId.GOERLI).toBe(5);
			expect(NetworkId.SEPOLIA).toBe(11155111);
			expect(NetworkId.HOLESKY).toBe(17000);
		});
	});
});
