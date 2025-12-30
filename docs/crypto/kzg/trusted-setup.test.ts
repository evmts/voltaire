/**
 * Tests for code examples in docs/crypto/kzg/trusted-setup.mdx
 *
 * Note: This MDX file is a placeholder with no code examples.
 * Tests here cover trusted setup functionality based on EIP-4844 specification.
 *
 * API Discrepancies documented:
 * - Docs are placeholder with no actual examples yet
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("docs/crypto/kzg/trusted-setup.mdx - Trusted Setup", async () => {
	const {
		KZG,
		KzgNotInitializedError,
		BYTES_PER_COMMITMENT,
	} = await import("../../../src/crypto/KZG/index.js");

	afterAll(() => {
		// Ensure setup is loaded after tests
		if (!KZG.isInitialized()) {
			KZG.loadTrustedSetup();
		}
	});

	describe("Trusted Setup Loading", () => {
		/**
		 * From index.mdx:
		 * Trusted Setup: Must call loadTrustedSetup() before any KZG operations.
		 * Setup loads Ethereum KZG Ceremony parameters (~1 MB).
		 */
		it("should load trusted setup", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should be idempotent - multiple loads are safe", () => {
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should free trusted setup", () => {
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);
		});

		it("should be safe to free when not initialized", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			KZG.freeTrustedSetup(); // Safe to call again
			expect(KZG.isInitialized()).toBe(false);
		});
	});

	describe("Operations Require Trusted Setup", () => {
		/**
		 * From index.mdx:
		 * Native C Only: KZG operations via c-kzg-4844 library (trusted setup required)
		 */
		beforeAll(() => {
			KZG.freeTrustedSetup();
		});

		afterAll(() => {
			KZG.loadTrustedSetup();
		});

		it("should throw KzgNotInitializedError for Commitment without setup", () => {
			expect(KZG.isInitialized()).toBe(false);

			const blob = KZG.createEmptyBlob();
			expect(() => KZG.Commitment(blob)).toThrow(KzgNotInitializedError);
		});

		it("should throw KzgNotInitializedError for Proof without setup", () => {
			expect(KZG.isInitialized()).toBe(false);

			const blob = KZG.createEmptyBlob();
			const z = new Uint8Array(32);
			expect(() => KZG.Proof(blob, z)).toThrow(KzgNotInitializedError);
		});

		it("should throw KzgNotInitializedError for verifyKzgProof without setup", () => {
			expect(KZG.isInitialized()).toBe(false);

			const commitment = new Uint8Array(48);
			const z = new Uint8Array(32);
			const y = new Uint8Array(32);
			const proof = new Uint8Array(48);

			expect(() => KZG.verifyKzgProof(commitment, z, y, proof)).toThrow(
				KzgNotInitializedError,
			);
		});
	});

	describe("Re-initialization", () => {
		/**
		 * Tests that trusted setup can be freed and reloaded
		 */
		it("should support free and reload cycle", () => {
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			// Create commitment
			const blob1 = KZG.generateRandomBlob(1);
			const commitment1 = KZG.Commitment(blob1);

			// Free and reload
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			// Create another commitment - should work
			const blob2 = KZG.generateRandomBlob(2);
			const commitment2 = KZG.Commitment(blob2);
			expect(commitment2.length).toBe(BYTES_PER_COMMITMENT);

			// Same blob should produce same commitment after reload
			const commitment1Again = KZG.Commitment(blob1);
			expect(commitment1Again).toEqual(commitment1);
		});
	});

	describe("Ceremony Parameters", () => {
		/**
		 * From index.mdx:
		 * - 140,000+ participants (Ethereum KZG ceremony 2023)
		 * - Safe if ANY participant destroyed their secret
		 * - Setup Size: ~1 MB (4096 G1 points + 65 G2 points)
		 */
		beforeAll(() => {
			KZG.loadTrustedSetup();
		});

		it("should produce valid commitments with ceremony parameters", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// Commitment should be valid 48-byte BLS12-381 G1 point
			expect(commitment.length).toBe(48);
			expect(commitment.some((b) => b !== 0)).toBe(true);
		});

		it("should produce valid proofs with ceremony parameters", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);

			const { proof, y } = KZG.Proof(blob, z);

			expect(proof.length).toBe(48);
			expect(y.length).toBe(32);
		});

		it("should verify proofs correctly with ceremony parameters", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Utility Functions Without Setup", () => {
		/**
		 * Some utility functions should work without trusted setup
		 */
		it("should create empty blob without setup", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			const blob = KZG.createEmptyBlob();
			expect(blob.length).toBe(131072);

			KZG.loadTrustedSetup();
		});

		it("should generate random blob without setup", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			const blob = KZG.generateRandomBlob(42);
			expect(blob.length).toBe(131072);

			KZG.loadTrustedSetup();
		});

		it("should validate blob without setup", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			const validBlob = KZG.createEmptyBlob();
			expect(() => KZG.validateBlob(validBlob)).not.toThrow();

			const invalidBlob = new Uint8Array(1000);
			expect(() => KZG.validateBlob(invalidBlob)).toThrow();

			KZG.loadTrustedSetup();
		});

		it("should check initialization status", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);
		});
	});
});
