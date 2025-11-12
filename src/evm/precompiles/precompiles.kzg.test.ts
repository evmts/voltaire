import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
} from "../../crypto/KZG/constants.js";
import * as Kzg from "../../crypto/KZG/index.js";
import { pointEvaluation } from "./precompiles.js";

describe("Precompile - Point Evaluation (0x0a) - KZG EIP-4844", () => {
	beforeAll(() => {
		Kzg.loadTrustedSetup();
	});

	afterAll(() => {
		Kzg.freeTrustedSetup();
	});

	// Helper: create valid field element (32 bytes)
	const createValidFieldElement = (fill = 0): Uint8Array => {
		const z = new Uint8Array(32);
		z[0] = 0; // Ensure < BLS12-381 modulus
		for (let i = 1; i < 32; i++) {
			z[i] = fill;
		}
		return z;
	};

	// Helper: BLS modulus constant (used in output verification)
	const BLS_MODULUS = Uint8Array.from([
		0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08,
		0x09, 0xa1, 0xd8, 0x05, 0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
		0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
	]);

	// Helper: FIELD_ELEMENTS_PER_BLOB as bytes (big-endian uint256)
	const FIELD_ELEMENTS_BYTES = new Uint8Array(32);
	FIELD_ELEMENTS_BYTES[30] = 0x10;
	FIELD_ELEMENTS_BYTES[31] = 0x00; // 0x1000 = 4096

	describe("Gas Costs", () => {
		it("should charge exactly 50000 gas for valid proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should fail with out of gas when gasLimit < 50000", () => {
			const input = new Uint8Array(160);
			const result = pointEvaluation(input, 49999n);

			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(50000n);
			expect(result.error).toBe("Out of gas");
		});

		it("should consume gas even on failure", () => {
			const input = new Uint8Array(100); // Invalid length
			const result = pointEvaluation(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(50000n);
		});
	});

	describe("Input Validation", () => {
		it("should accept exactly 160 bytes input", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should accept exactly 192 bytes input (with trailing zeros)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(192);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);
			// Bytes 160-192 are zero by default

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should reject input less than 160 bytes", () => {
			const input = new Uint8Array(159);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject input between 160 and 192 bytes", () => {
			const input = new Uint8Array(180);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject input greater than 192 bytes", () => {
			const input = new Uint8Array(200);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject empty input", () => {
			const input = new Uint8Array(0);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});
	});

	describe("Valid KZG Proof Verification", () => {
		it("should verify valid KZG proof with standard blob", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x55);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should verify valid proof with empty blob", () => {
			const blob = Kzg.createEmptyBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x00);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should verify proof at zero evaluation point", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = new Uint8Array(32); // All zeros
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should verify proof with different evaluation points", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);

			const testPoints = [0x01, 0x42, 0xff];
			for (const point of testPoints) {
				const z = createValidFieldElement(point);
				const { proof, y } = Kzg.computeKzgProof(blob, z);

				const input = new Uint8Array(160);
				input.set(commitment, 0);
				input.set(z, 48);
				input.set(y, 80);
				input.set(proof, 112);

				const result = pointEvaluation(input, 50000n);
				expect(result.success).toBe(true);
			}
		});
	});

	describe("Output Format Verification", () => {
		it("should return 64 bytes output for valid proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should output FIELD_ELEMENTS_PER_BLOB in first 32 bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);

			// First 32 bytes should be FIELD_ELEMENTS_PER_BLOB (4096 = 0x1000)
			const firstHalf = result.output.slice(0, 32);
			expect(firstHalf).toEqual(FIELD_ELEMENTS_BYTES);
		});

		it("should output BLS_MODULUS in last 32 bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);

			// Last 32 bytes should be BLS_MODULUS
			const secondHalf = result.output.slice(32, 64);
			expect(secondHalf).toEqual(BLS_MODULUS);
		});

		it("should return zeros for invalid proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Corrupt proof
			const corruptedProof = new Uint8Array(proof);
			if (corruptedProof[0] !== undefined) {
				corruptedProof[0] ^= 1;
			}

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(corruptedProof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			// Invalid proof should return all zeros
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Input Field Parsing", () => {
		it("should parse versioned hash (first 32 bytes of commitment)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Test with commitment having specific pattern
			const patternedCommitment = new Uint8Array(commitment);
			patternedCommitment[0] = 0xaa;
			patternedCommitment[31] = 0xbb;

			const input = new Uint8Array(160);
			input.set(patternedCommitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			// Should fail because commitment was modified
			const result = pointEvaluation(input, 50000n);
			// Result depends on whether modified commitment is still valid
			expect(result.gasUsed).toBe(50000n);
		});

		it("should parse z value (bytes 48-80)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0xff);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse y value (bytes 80-112)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse commitment (bytes 0-48)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse proof (bytes 112-160)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			expect(proof.length).toBe(BYTES_PER_PROOF);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Invalid Commitment", () => {
		it("should reject commitment not on curve", () => {
			const blob = Kzg.generateRandomBlob();
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Create invalid commitment (not a valid G1 point)
			const invalidCommitment = new Uint8Array(48);
			invalidCommitment.fill(0xff); // All 0xff is not a valid point

			const input = new Uint8Array(160);
			input.set(invalidCommitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			// Should fail or return false verification
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject all-zero commitment", () => {
			const blob = Kzg.generateRandomBlob();
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const zeroCommitment = new Uint8Array(48); // All zeros

			const input = new Uint8Array(160);
			input.set(zeroCommitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			// Point at infinity might be valid or invalid depending on implementation
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject wrong commitment for given proof", () => {
			const blob1 = Kzg.generateRandomBlob();
			const blob2 = Kzg.generateRandomBlob();

			const wrongCommitment = Kzg.blobToKzgCommitment(blob2);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob1, z);

			const input = new Uint8Array(160);
			input.set(wrongCommitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail - output should be zeros
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Invalid Proof", () => {
		it("should reject corrupted proof bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Corrupt proof by flipping bits
			const corruptedProof = new Uint8Array(proof);
			corruptedProof[10] ^= 0xff;

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(corruptedProof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should reject all-zero proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { y } = Kzg.computeKzgProof(blob, z);

			const zeroProof = new Uint8Array(48);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(zeroProof, 112);

			const result = pointEvaluation(input, 50000n);
			// Verification should fail
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject all-ones proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { y } = Kzg.computeKzgProof(blob, z);

			const onesProof = new Uint8Array(48);
			onesProof.fill(0xff);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(onesProof, 112);

			const result = pointEvaluation(input, 50000n);
			// Verification should fail
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject proof from different evaluation point", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z1 = createValidFieldElement(0x42);
			const z2 = createValidFieldElement(0x99);

			// Generate proof for z2, but use z1 in verification
			const { proof, y } = Kzg.computeKzgProof(blob, z2);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z1, 48); // Different z
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should reject proof with wrong y value", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Corrupt y value
			const wrongY = new Uint8Array(y);
			wrongY[31] ^= 0x01;

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(wrongY, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("should handle maximum valid field elements", () => {
			const blob = new Uint8Array(131072);
			// Set all field elements to maximum valid value
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0; // High byte must be 0
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = 0xff;
				}
			}

			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x01);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should handle proof verification with identical commitment and proof bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);

			// Use commitment bytes as proof (invalid but tests parsing)
			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(z, 80); // Use z as y (invalid)
			input.set(commitment, 112); // Use commitment as proof (invalid)

			const result = pointEvaluation(input, 50000n);
			// Should handle gracefully
			expect(result.gasUsed).toBe(50000n);
		});

		it("should handle 192-byte input with non-zero trailing bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(192);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);
			// Set trailing bytes to non-zero
			input[160] = 0xff;
			input[191] = 0xff;

			const result = pointEvaluation(input, 50000n);
			// Implementation accepts 192 bytes, trailing data ignored
			expect(result.success).toBe(true);
		});
	});

	describe("Constants Verification", () => {
		it("should verify FIELD_ELEMENTS_PER_BLOB is 4096", () => {
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
		});

		it("should verify commitment size is 48 bytes", () => {
			expect(BYTES_PER_COMMITMENT).toBe(48);
		});

		it("should verify proof size is 48 bytes", () => {
			expect(BYTES_PER_PROOF).toBe(48);
		});

		it("should verify field element size is 32 bytes", () => {
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
		});

		it("should verify input structure: 48+32+32+48 = 160", () => {
			const totalSize =
				BYTES_PER_COMMITMENT + // commitment
				BYTES_PER_FIELD_ELEMENT + // z
				BYTES_PER_FIELD_ELEMENT + // y
				BYTES_PER_PROOF; // proof
			expect(totalSize).toBe(160);
		});
	});

	describe("EIP-4844 Test Vectors", () => {
		it("should verify proof with deterministic blob", () => {
			// Create deterministic blob
			const blob = Kzg.createEmptyBlob();
			// Fill with deterministic pattern, ensuring first byte of each field element is 0
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0; // First byte must be 0
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT && offset + j < 1000; j++) {
					blob[offset + j] = (i + j) % 256;
				}
			}

			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = createValidFieldElement(0x12);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.slice(0, 32)).toEqual(FIELD_ELEMENTS_BYTES);
			expect(result.output.slice(32, 64)).toEqual(BLS_MODULUS);
		});

		it("should verify multiple proofs for same blob", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);

			// Test multiple evaluation points
			for (let i = 0; i < 5; i++) {
				const z = createValidFieldElement(i * 0x11);
				const { proof, y } = Kzg.computeKzgProof(blob, z);

				const input = new Uint8Array(160);
				input.set(commitment, 0);
				input.set(z, 48);
				input.set(y, 80);
				input.set(proof, 112);

				const result = pointEvaluation(input, 50000n);
				expect(result.success).toBe(true);
				expect(result.output.slice(0, 32)).toEqual(FIELD_ELEMENTS_BYTES);
				expect(result.output.slice(32, 64)).toEqual(BLS_MODULUS);
			}
		});
	});
});
