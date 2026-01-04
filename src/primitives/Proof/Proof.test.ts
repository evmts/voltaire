import { describe, expect, it } from "vitest";
import * as Proof from "./index.js";

describe("Proof", () => {
	describe("from", () => {
		it("creates Proof from object", () => {
			const value = new Uint8Array([1, 2, 3, 4]);
			const proofArray = [
				new Uint8Array([5, 6, 7, 8]),
				new Uint8Array([9, 10, 11, 12]),
			];

			const proof = Proof.from({
				value,
				proof: proofArray,
			});

			expect(proof).toBeDefined();
			expect(proof.value).toEqual(value);
			expect(proof.proof).toHaveLength(2);
			expect(proof.proof[0]).toEqual(proofArray[0]);
			expect(proof.proof[1]).toEqual(proofArray[1]);
		});

		it("accepts empty proof array", () => {
			const value = new Uint8Array([1, 2, 3, 4]);

			const proof = Proof.from({
				value,
				proof: [],
			});

			expect(proof.value).toEqual(value);
			expect(proof.proof).toHaveLength(0);
		});

		it("returns immutable object", () => {
			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});

			expect(Object.isFrozen(proof)).toBe(true);
			expect(Object.isFrozen(proof.proof)).toBe(true);
		});

		it("throws on invalid value type", () => {
			expect(() =>
				Proof.from({
					// @ts-expect-error - testing invalid type
					value: "not a uint8array",
					proof: [],
				}),
			).toThrow("value must be a Uint8Array");
		});

		it("throws on invalid proof type", () => {
			expect(() =>
				Proof.from({
					value: new Uint8Array([1, 2, 3]),
					// @ts-expect-error - testing invalid type
					proof: "not an array",
				}),
			).toThrow("proof must be an array");
		});

		it("throws on invalid proof element type", () => {
			expect(() =>
				Proof.from({
					value: new Uint8Array([1, 2, 3]),
					// @ts-expect-error - testing invalid element type
					proof: [new Uint8Array([4, 5]), "invalid", new Uint8Array([6, 7])],
				}),
			).toThrow("proof[1] must be a Uint8Array");
		});
	});

	describe("equals", () => {
		it("returns true for equal proofs", () => {
			const value = new Uint8Array([1, 2, 3, 4]);
			const proofArray = [
				new Uint8Array([5, 6, 7, 8]),
				new Uint8Array([9, 10, 11, 12]),
			];

			const proof1 = Proof.from({ value, proof: proofArray });
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [new Uint8Array([5, 6, 7, 8]), new Uint8Array([9, 10, 11, 12])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(true);
		});

		it("returns false for different values", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 4]), // Different last byte
				proof: [new Uint8Array([4, 5, 6])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different proof lengths", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different proof elements", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 7])], // Different last byte
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("handles empty proofs", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [],
			});

			expect(Proof.equals(proof1, proof2)).toBe(true);
		});
	});

	describe("verify", () => {
		it("validates correctly formatted proof", () => {
			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [new Uint8Array(32).fill(0xaa), new Uint8Array(32).fill(0xbb)],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("validates empty proof array", () => {
			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
		});

		it("rejects proof node that is not 32 bytes", () => {
			// Create proof manually to bypass from() validation
			const invalidProof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array(31).fill(0xaa)], // 31 bytes instead of 32
			};

			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.proof[0] must be 32 bytes (got 31)");
		});

		it("rejects proof node that is too long", () => {
			const invalidProof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array(33).fill(0xaa)], // 33 bytes instead of 32
			};

			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.proof[0] must be 32 bytes (got 33)");
		});

		it("rejects proof with mixed valid and invalid nodes", () => {
			const invalidProof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [
					new Uint8Array(32).fill(0xaa), // valid
					new Uint8Array(16).fill(0xbb), // invalid - only 16 bytes
					new Uint8Array(32).fill(0xcc), // valid
				],
			};

			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.proof[1] must be 32 bytes (got 16)");
		});

		it("rejects null proof", () => {
			// @ts-expect-error - testing invalid input
			const result = Proof.verify(null);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof must be an object");
		});

		it("rejects proof with non-Uint8Array value", () => {
			const invalidProof = {
				value: "not a uint8array",
				proof: [],
			};

			// @ts-expect-error - testing invalid input
			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.value must be a Uint8Array");
		});

		it("rejects proof with non-array proof field", () => {
			const invalidProof = {
				value: new Uint8Array([1, 2, 3]),
				proof: "not an array",
			};

			// @ts-expect-error - testing invalid input
			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.proof must be an array");
		});

		it("rejects proof with non-Uint8Array element", () => {
			const invalidProof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array(32), "not a uint8array"],
			};

			// @ts-expect-error - testing invalid input
			const result = Proof.verify(invalidProof);
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Proof.proof[1] must be a Uint8Array");
		});
	});

	describe("immutability", () => {
		it("prevents modification of value", () => {
			const value = new Uint8Array([1, 2, 3]);
			const proof = Proof.from({ value, proof: [] });

			// Original array modification shouldn't affect proof
			value[0] = 99;
			expect(proof.value[0]).toBe(1);
		});

		it("prevents modification of proof array", () => {
			const proofArray = [new Uint8Array([1, 2, 3])];
			const proof = Proof.from({
				value: new Uint8Array([4, 5, 6]),
				proof: proofArray,
			});

			// Original array modification shouldn't affect proof
			proofArray.push(new Uint8Array([7, 8, 9]));
			expect(proof.proof).toHaveLength(1);
		});
	});
});
