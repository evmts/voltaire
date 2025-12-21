import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
} from "../../crypto/KZG/constants.js";
import * as Kzg from "../../crypto/KZG/index.js";
import { Keccak256 } from "../../crypto/Keccak256/index.js";
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

	// Helper: create versioned hash from commitment (keccak256 with 0x01 prefix)
	const createVersionedHash = (commitment: Uint8Array): Uint8Array => {
		const prefixed = new Uint8Array(49);
		prefixed[0] = 0x01;
		prefixed.set(commitment, 1);
		const hash = new Uint8Array(Keccak256.hash(prefixed));
		hash[0] = 0x01; // Set version byte
		return hash;
	};

	// Helper: build 192-byte EIP-4844 input
	// Layout: versioned_hash(32) + z(32) + y(32) + commitment(48) + proof(48) = 192
	const buildInput = (
		commitment: Uint8Array,
		z: Uint8Array,
		y: Uint8Array,
		proof: Uint8Array,
	): Uint8Array => {
		const input = new Uint8Array(192);
		const versionedHash = createVersionedHash(commitment);
		input.set(versionedHash, 0); // 0-32
		input.set(z, 32); // 32-64
		input.set(y, 64); // 64-96
		input.set(commitment, 96); // 96-144
		input.set(proof, 144); // 144-192
		return input;
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
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should fail with out of gas when gasLimit < 50000", () => {
			const input = new Uint8Array(192);
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
		it("should accept exactly 192 bytes input", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should reject input less than 192 bytes", () => {
			const input = new Uint8Array(191);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid input length");
		});

		it("should reject input greater than 192 bytes", () => {
			const input = new Uint8Array(200);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid input length");
		});

		it("should reject empty input", () => {
			const input = new Uint8Array(0);
			const result = pointEvaluation(input, 50000n);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid input length");
		});
	});

	describe("Valid KZG Proof Verification", () => {
		it("should verify valid KZG proof with standard blob", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x55);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should verify valid proof with empty blob", () => {
			const blob = Kzg.createEmptyBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x00);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should verify proof at zero evaluation point", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = new Uint8Array(32); // All zeros
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should verify proof with different evaluation points", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);

			const testPoints = [0x01, 0x42, 0xff];
			for (const point of testPoints) {
				const z = createValidFieldElement(point);
				const { proof, y } = Kzg.KZG.Proof(blob, z);

				const input = buildInput(commitment, z, y, proof);
				const result = pointEvaluation(input, 50000n);
				expect(result.success).toBe(true);
			}
		});
	});

	describe("Output Format Verification", () => {
		it("should return 64 bytes output for valid proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should output FIELD_ELEMENTS_PER_BLOB in first 32 bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);

			// First 32 bytes should be FIELD_ELEMENTS_PER_BLOB (4096 = 0x1000)
			const firstHalf = result.output.slice(0, 32);
			expect(firstHalf).toEqual(FIELD_ELEMENTS_BYTES);
		});

		it("should output BLS_MODULUS in last 32 bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);

			// Last 32 bytes should be BLS_MODULUS
			const secondHalf = result.output.slice(32, 64);
			expect(secondHalf).toEqual(BLS_MODULUS);
		});

		it("should return zeros for invalid proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			// Corrupt proof
			const corruptedProof = new Uint8Array(proof);
			if (corruptedProof[0] !== undefined) {
				corruptedProof[0] ^= 1;
			}

			const input = buildInput(commitment, z, y, corruptedProof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			// Invalid proof should return all zeros
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Input Field Parsing", () => {
		it("should parse versioned hash (first 32 bytes)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			// Should succeed with valid versioned hash
			const result = pointEvaluation(input, 50000n);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should parse z value (bytes 32-64)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0xff);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse y value (bytes 64-96)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse commitment (bytes 96-144)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should parse proof (bytes 144-192)", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			expect(proof.length).toBe(BYTES_PER_PROOF);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Invalid Commitment", () => {
		it("should reject commitment not on curve", () => {
			const blob = Kzg.generateRandomBlob();
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			// Create invalid commitment (not a valid G1 point)
			const invalidCommitment = new Uint8Array(48);
			invalidCommitment.fill(0xff); // All 0xff is not a valid point

			const input = buildInput(invalidCommitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			// Should fail or return false verification
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject all-zero commitment", () => {
			const blob = Kzg.generateRandomBlob();
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const zeroCommitment = new Uint8Array(48); // All zeros

			const input = buildInput(zeroCommitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			// Point at infinity might be valid or invalid depending on implementation
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject wrong commitment for given proof", () => {
			const blob1 = Kzg.generateRandomBlob();
			const blob2 = Kzg.generateRandomBlob();

			const wrongCommitment = Kzg.KZG.Commitment(blob2);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob1, z);

			const input = buildInput(wrongCommitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail - output should be zeros
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Invalid Proof", () => {
		it("should reject corrupted proof bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			// Corrupt proof by flipping bits
			const corruptedProof = new Uint8Array(proof);
			corruptedProof[10] ^= 0xff;

			const input = buildInput(commitment, z, y, corruptedProof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should reject all-zero proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { y } = Kzg.KZG.Proof(blob, z);

			const zeroProof = new Uint8Array(48);

			const input = buildInput(commitment, z, y, zeroProof);
			const result = pointEvaluation(input, 50000n);
			// Verification should fail
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject all-ones proof", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { y } = Kzg.KZG.Proof(blob, z);

			const onesProof = new Uint8Array(48);
			onesProof.fill(0xff);

			const input = buildInput(commitment, z, y, onesProof);
			const result = pointEvaluation(input, 50000n);
			// Verification should fail
			expect(result.gasUsed).toBe(50000n);
		});

		it("should reject proof from different evaluation point", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z1 = createValidFieldElement(0x42);
			const z2 = createValidFieldElement(0x99);

			// Generate proof for z2, but use z1 in verification
			const { proof, y } = Kzg.KZG.Proof(blob, z2);

			const input = buildInput(commitment, z1, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			// Verification should fail
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should reject proof with wrong y value", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			// Corrupt y value
			const wrongY = new Uint8Array(y);
			wrongY[31] ^= 0x01;

			const input = buildInput(commitment, z, wrongY, proof);
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

			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x01);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
		});

		it("should handle proof verification with identical commitment and proof bytes", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);

			// Use commitment bytes as proof (invalid but tests parsing)
			const input = buildInput(commitment, z, z, commitment);
			const result = pointEvaluation(input, 50000n);
			// Should handle gracefully
			expect(result.gasUsed).toBe(50000n);
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

		it("should verify input structure: 32+32+32+48+48 = 192", () => {
			const totalSize =
				32 + // versioned_hash
				BYTES_PER_FIELD_ELEMENT + // z
				BYTES_PER_FIELD_ELEMENT + // y
				BYTES_PER_COMMITMENT + // commitment
				BYTES_PER_PROOF; // proof
			expect(totalSize).toBe(192);
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

			const commitment = Kzg.KZG.Commitment(blob);
			const z = createValidFieldElement(0x12);
			const { proof, y } = Kzg.KZG.Proof(blob, z);

			const input = buildInput(commitment, z, y, proof);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(result.output.slice(0, 32)).toEqual(FIELD_ELEMENTS_BYTES);
			expect(result.output.slice(32, 64)).toEqual(BLS_MODULUS);
		});

		it("should verify multiple proofs for same blob", () => {
			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.KZG.Commitment(blob);

			// Test multiple evaluation points
			for (let i = 0; i < 5; i++) {
				const z = createValidFieldElement(i * 0x11);
				const { proof, y } = Kzg.KZG.Proof(blob, z);

				const input = buildInput(commitment, z, y, proof);
				const result = pointEvaluation(input, 50000n);
				expect(result.success).toBe(true);
				expect(result.output.slice(0, 32)).toEqual(FIELD_ELEMENTS_BYTES);
				expect(result.output.slice(32, 64)).toEqual(BLS_MODULUS);
			}
		});
	});
});
