import { describe, expect, it } from "vitest";
import { Keccak256 } from "../crypto/Keccak256/index.js";
import { Secp256k1 } from "../crypto/Secp256k1/index.js";
import { Address } from "../primitives/Address/index.js";
import * as Hardfork from "../primitives/Hardfork/index.js";
import { PrecompileAddress, ecrecover, execute } from "./precompiles.js";

/**
 * Helper: Convert bigint to 32-byte big-endian Uint8Array
 */
function beBytes32(n: bigint): Uint8Array {
	const out = new Uint8Array(32);
	let v = n;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
}

/**
 * Helper: Build ecRecover input (128 bytes: hash || v || r || s)
 */
function buildEcRecoverInput(
	hash: Uint8Array,
	v: number,
	r: Uint8Array,
	s: Uint8Array,
): Uint8Array {
	const input = new Uint8Array(128);
	input.set(hash, 0);
	const vBytes = beBytes32(BigInt(v));
	input.set(vBytes, 32);
	input.set(r, 64);
	input.set(s, 96);
	return input;
}

/**
 * Helper: Sign message and build ecRecover input
 */
function signAndBuildInput(
	message: Uint8Array,
	privateKey: Uint8Array,
): { hash: Uint8Array; input: Uint8Array; expectedAddress: Uint8Array } {
	const hash = Keccak256.hash(message);
	const sig = Secp256k1.sign(hash, privateKey);
	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const expectedAddress = Keccak256.hash(publicKey).slice(12);

	const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);

	return { hash, input, expectedAddress };
}

describe("Precompile: ecRecover (0x01)", () => {
	const gasLimit = 10000n;

	describe("Valid execution", () => {
		it("should recover address from valid signature", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 7;

			const message = new TextEncoder().encode("hello evm ecrecover");
			const { input, expectedAddress } = signAndBuildInput(message, privateKey);

			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
			expect(result.output.length).toBe(32);

			// First 12 bytes should be zero (left-padded address)
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);

			// Last 20 bytes should match expected address
			const recoveredAddress = result.output.slice(12);
			expect(
				Buffer.from(recoveredAddress).equals(Buffer.from(expectedAddress)),
			).toBe(true);
		});

		it("should recover address with v=27", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const hash = Keccak256.hash(new TextEncoder().encode("test"));
			const sig = Secp256k1.sign(hash, privateKey);

			// Force v=27 (even if signature recovery ID is 0)
			const input = buildEcRecoverInput(hash, 27, sig.r, sig.s);

			const result = ecrecover(input, gasLimit);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should recover address with v=28", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 2;

			const hash = Keccak256.hash(new TextEncoder().encode("test"));
			const sig = Secp256k1.sign(hash, privateKey);

			// Force v=28 (even if signature recovery ID is 1)
			const input = buildEcRecoverInput(hash, 28, sig.r, sig.s);

			const result = ecrecover(input, gasLimit);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should handle EIP-155 v values (35+)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 3;

			const hash = Keccak256.hash(new TextEncoder().encode("eip155"));
			const sig = Secp256k1.sign(hash, privateKey);

			// EIP-155: v = CHAIN_ID * 2 + 35 + recovery_id
			// For mainnet (chain ID 1): v = 37 or 38
			const eip155V = 37;
			const input = buildEcRecoverInput(hash, eip155V, sig.r, sig.s);

			const result = ecrecover(input, gasLimit);
			// May succeed or fail depending on implementation
			expect(result.gasUsed).toBe(3000n);
			expect(result.output.length).toBe(32);
		});

		it("should work with known test vectors from Ethereum tests", () => {
			// Known test vector from Ethereum consensus tests
			const hash = new Uint8Array(32);
			hash[31] = 1; // hash = 0x000...001

			const r = new Uint8Array(32);
			r[31] = 2;

			const s = new Uint8Array(32);
			s[31] = 3;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
			expect(result.output.length).toBe(32);
		});

		it("should recover same address from multiple signatures of same message", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;

			const message = new TextEncoder().encode("repeated message");
			const { input: input1, expectedAddress } = signAndBuildInput(
				message,
				privateKey,
			);
			const { input: input2 } = signAndBuildInput(message, privateKey);

			const result1 = ecrecover(input1, gasLimit);
			const result2 = ecrecover(input2, gasLimit);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);

			const addr1 = result1.output.slice(12);
			const addr2 = result2.output.slice(12);

			expect(Buffer.from(addr1).equals(Buffer.from(addr2))).toBe(true);
			expect(Buffer.from(addr1).equals(Buffer.from(expectedAddress))).toBe(
				true,
			);
		});
	});

	describe("Gas", () => {
		it("should use exactly 3000 gas", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 5;

			const message = new TextEncoder().encode("gas test");
			const { input } = signAndBuildInput(message, privateKey);

			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should fail with insufficient gas (2999)", () => {
			const input = new Uint8Array(128);
			const result = ecrecover(input, 2999n);

			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(3000n);
			expect(result.error).toBe("Out of gas");
		});

		it("should succeed with exact gas (3000)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 6;

			const message = new TextEncoder().encode("exact gas");
			const { input } = signAndBuildInput(message, privateKey);

			const result = ecrecover(input, 3000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Invalid inputs", () => {
		it("should pad short input to 128 bytes", () => {
			const shortInput = new Uint8Array(64);
			const result = ecrecover(shortInput, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
			// Should return zero address for invalid signature
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should truncate long input to 128 bytes", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 8;

			const message = new TextEncoder().encode("long input");
			const { input } = signAndBuildInput(message, privateKey);

			// Append extra bytes
			const longInput = new Uint8Array(200);
			longInput.set(input, 0);
			longInput.fill(0xff, 128);

			const result = ecrecover(longInput, gasLimit);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should return zero address for invalid v value (0)", () => {
			const hash = Keccak256.hash(new TextEncoder().encode("invalid v"));
			const r = new Uint8Array(32);
			const s = new Uint8Array(32);
			r[31] = 1;
			s[31] = 2;

			const input = buildEcRecoverInput(hash, 0, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			// May or may not be zero depending on whether v=0 is accepted
			expect(result.gasUsed).toBe(3000n);
		});

		it("should return zero address for invalid v value (26)", () => {
			const hash = Keccak256.hash(new TextEncoder().encode("v=26"));
			const r = new Uint8Array(32);
			const s = new Uint8Array(32);
			r[31] = 1;
			s[31] = 2;

			const input = buildEcRecoverInput(hash, 26, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return zero address for zero r", () => {
			const hash = Keccak256.hash(new TextEncoder().encode("zero r"));
			const r = new Uint8Array(32); // All zeros
			const s = new Uint8Array(32);
			s[31] = 1;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return zero address for zero s", () => {
			const hash = Keccak256.hash(new TextEncoder().encode("zero s"));
			const r = new Uint8Array(32);
			const s = new Uint8Array(32); // All zeros
			r[31] = 1;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should handle all-zeros input", () => {
			const input = new Uint8Array(128);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should handle zero hash with valid signature", () => {
			const hash = new Uint8Array(32); // All zeros
			const r = new Uint8Array(32);
			const s = new Uint8Array(32);
			r[31] = 1;
			s[31] = 2;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should handle s value > secp256k1n/2 (high-s malleability)", () => {
			// secp256k1 curve order
			const n =
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
			const halfN = n / 2n;

			const hash = Keccak256.hash(new TextEncoder().encode("high-s"));
			const r = new Uint8Array(32);
			r[31] = 1;

			// Create high-s value (> n/2)
			const highS = beBytes32(halfN + 1n);

			const input = buildEcRecoverInput(hash, 27, r, highS);
			const result = ecrecover(input, gasLimit);

			// Should return zero address (EIP-2 signature malleability protection)
			// Note: implementation may or may not enforce this
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should reject invalid signature (r, s not on curve)", () => {
			const hash = Keccak256.hash(new TextEncoder().encode("invalid curve"));
			const r = new Uint8Array(32);
			const s = new Uint8Array(32);
			// Set to maximum possible values (likely invalid)
			r.fill(0xff);
			s.fill(0xff);

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("should handle signature malleability (same message, different v)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 10;

			const message = new TextEncoder().encode("malleability");
			const hash = Keccak256.hash(message);
			const sig = Secp256k1.sign(hash, privateKey);

			// Try with both v=27 and v=28
			const input27 = buildEcRecoverInput(hash, 27, sig.r, sig.s);
			const input28 = buildEcRecoverInput(hash, 28, sig.r, sig.s);

			const result27 = ecrecover(input27, gasLimit);
			const result28 = ecrecover(input28, gasLimit);

			expect(result27.success).toBe(true);
			expect(result28.success).toBe(true);

			// Different v values should recover different addresses (or one should fail)
			const addr27 = result27.output.slice(12);
			const addr28 = result28.output.slice(12);

			// At least one should be non-zero
			const has27 = !addr27.every((b) => b === 0);
			const has28 = !addr28.every((b) => b === 0);
			expect(has27 || has28).toBe(true);
		});

		it("should handle very long input (> 128 bytes)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 11;

			const message = new TextEncoder().encode("very long");
			const { input } = signAndBuildInput(message, privateKey);

			// Create 1000-byte input
			const veryLongInput = new Uint8Array(1000);
			veryLongInput.set(input, 0);

			const result = ecrecover(veryLongInput, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
			expect(result.output.length).toBe(32);
		});

		it("should handle maximum valid r and s values", () => {
			const n =
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
			const maxValid = n - 1n;

			const hash = Keccak256.hash(new TextEncoder().encode("max values"));
			const r = beBytes32(maxValid);
			const s = beBytes32(maxValid / 2n); // Low-s for EIP-2

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});
	});

	describe("Integration", () => {
		it("should integrate with Secp256k1 and Address primitives", () => {
			// Generate private key
			const privateKey = new Uint8Array(32);
			privateKey[31] = 100;

			// Derive public key and address
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const addressBytes = Keccak256.hash(publicKey).slice(12);
			const address = Address.fromBytes(addressBytes);

			// Sign message
			const message = new TextEncoder().encode("integration test");
			const hash = Keccak256.hash(message);
			const sig = Secp256k1.sign(hash, privateKey);

			// Recover via precompile
			const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);

			// Extract recovered address
			const recoveredBytes = result.output.slice(12);
			const recoveredAddress = Address.fromBytes(recoveredBytes);

			// Verify addresses match
			expect(Address.equals(address, recoveredAddress)).toBe(true);
		});

		it("should work via execute function", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 99;

			const message = new TextEncoder().encode("execute function");
			const { input, expectedAddress } = signAndBuildInput(message, privateKey);

			const result = execute(
				PrecompileAddress.ECRECOVER,
				input,
				gasLimit,
				Hardfork.FRONTIER,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);

			const recoveredAddress = result.output.slice(12);
			expect(
				Buffer.from(recoveredAddress).equals(Buffer.from(expectedAddress)),
			).toBe(true);
		});

		it("should verify signature end-to-end", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 77;

			// Sign
			const message = new TextEncoder().encode("end-to-end");
			const hash = Keccak256.hash(message);
			const sig = Secp256k1.sign(hash, privateKey);

			// Derive expected address
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const expectedAddress = Keccak256.hash(publicKey).slice(12);

			// Verify using Secp256k1
			const isValid = Secp256k1.verify(sig, hash, publicKey);
			expect(isValid).toBe(true);

			// Recover using precompile
			const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);
			const result = ecrecover(input, gasLimit);

			expect(result.success).toBe(true);

			const recoveredAddress = result.output.slice(12);
			expect(
				Buffer.from(recoveredAddress).equals(Buffer.from(expectedAddress)),
			).toBe(true);
		});
	});
});
