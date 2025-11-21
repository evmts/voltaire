import { describe, expect, it } from "vitest";
import * as StateRoot from "./index.js";

describe("StateRoot", () => {
	describe("from", () => {
		it("creates StateRoot from hex string", () => {
			const hex =
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root = StateRoot.from(hex);

			expect(root).toBeInstanceOf(Uint8Array);
			expect(root.length).toBe(32);
			expect(StateRoot.toHex(root)).toBe(hex);
		});

		it("creates StateRoot from Uint8Array", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xd7;
			bytes[31] = 0x44;

			const root = StateRoot.from(bytes);
			expect(root).toBeInstanceOf(Uint8Array);
			expect(root.length).toBe(32);
			expect(root[0]).toBe(0xd7);
			expect(root[31]).toBe(0x44);
		});

		it("returns existing StateRoot unchanged", () => {
			const root1 = StateRoot.from(
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
			);
			const root2 = StateRoot.from(root1);

			expect(root2).toBe(root1);
		});

		it("throws on invalid length", () => {
			expect(() => StateRoot.from(new Uint8Array(31))).toThrow();
			expect(() => StateRoot.from(new Uint8Array(33))).toThrow();
		});
	});

	describe("fromHex", () => {
		it("creates StateRoot from hex with 0x prefix", () => {
			const hex =
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root = StateRoot.fromHex(hex);

			expect(StateRoot.toHex(root)).toBe(hex);
		});

		it("creates StateRoot from hex without 0x prefix", () => {
			const hex =
				"d7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root = StateRoot.fromHex(hex);

			expect(StateRoot.toHex(root)).toBe(`0x${hex}`);
		});
	});

	describe("toHex", () => {
		it("converts StateRoot to hex string", () => {
			const hex =
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root = StateRoot.from(hex);

			expect(StateRoot.toHex(root)).toBe(hex);
		});

		it("includes 0x prefix", () => {
			const root = StateRoot.from(new Uint8Array(32));
			const hex = StateRoot.toHex(root);

			expect(hex).toMatch(/^0x/);
		});
	});

	describe("equals", () => {
		it("returns true for equal StateRoots", () => {
			const hex =
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root1 = StateRoot.from(hex);
			const root2 = StateRoot.from(hex);

			expect(StateRoot.equals(root1, root2)).toBe(true);
		});

		it("returns false for different StateRoots", () => {
			const root1 = StateRoot.from(
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
			);
			const root2 = StateRoot.from(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);

			expect(StateRoot.equals(root1, root2)).toBe(false);
		});

		it("uses constant-time comparison", () => {
			const root1 = StateRoot.from(new Uint8Array(32).fill(0xff));
			const root2 = StateRoot.from(new Uint8Array(32).fill(0x00));

			// Should not throw and should return false
			expect(StateRoot.equals(root1, root2)).toBe(false);
		});
	});

	describe("integration", () => {
		it("round-trips through hex", () => {
			const original =
				"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
			const root = StateRoot.from(original);
			const hex = StateRoot.toHex(root);
			const root2 = StateRoot.fromHex(hex);

			expect(StateRoot.equals(root, root2)).toBe(true);
			expect(hex).toBe(original);
		});
	});
});
