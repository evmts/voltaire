/**
 * Tests for ecrecover.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, ecrecover, execute } from "../../../src/evm/precompiles/precompiles.js";
import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Secp256k1 } from "../../../src/crypto/Secp256k1/index.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

/**
 * Helper: Build ecRecover input (128 bytes: hash || v || r || s)
 * Matches documentation input format
 */
function buildEcRecoverInput(
	hash: Uint8Array,
	v: number,
	r: Uint8Array,
	s: Uint8Array,
): Uint8Array {
	const input = new Uint8Array(128);
	input.set(hash, 0);
	// v is padded to 32 bytes (last byte contains value)
	const vBytes = new Uint8Array(32);
	vBytes[31] = v;
	input.set(vBytes, 32);
	input.set(r, 64);
	input.set(s, 96);
	return input;
}

describe("ecrecover.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should recover address from signature as described", () => {
			// Doc states: Given a message hash and signature components (v, r, s),
			// it returns the 20-byte Ethereum address of the signer
			const privateKey = new Uint8Array(32);
			privateKey[31] = 7;

			const message = new TextEncoder().encode("test message");
			const hash = Keccak256.hash(message);
			const sig = Secp256k1.sign(hash, privateKey);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const expectedAddress = Keccak256.hash(publicKey).slice(12);

			const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// First 12 bytes should be zero padding
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
			// Last 20 bytes should be address
			const recoveredAddress = result.output.slice(12);
			expect(Hex.fromBytes(recoveredAddress)).toBe(Hex.fromBytes(expectedAddress));
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 3000 gas as documented", () => {
			// Doc states: Fixed: 3000 gas
			const input = new Uint8Array(128);
			const result = ecrecover(input, 10000n);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas (gasLimit < 3000)
			const input = new Uint8Array(128);
			const result = ecrecover(input, 2999n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should consume gas even for invalid signatures", () => {
			// Doc states: The cost is constant regardless of input validity
			const input = new Uint8Array(128);
			const result = ecrecover(input, 10000n);
			expect(result.gasUsed).toBe(3000n);
		});
	});

	describe("Input Format section", () => {
		it("should accept 128 bytes total input", () => {
			// Doc states: Total input length: 128 bytes
			const input = new Uint8Array(128);
			const result = ecrecover(input, 10000n);
			expect(result.success).toBe(true);
		});

		it("should pad short input to 128 bytes", () => {
			// Doc states: padded/truncated to this size
			const shortInput = new Uint8Array(64);
			const result = ecrecover(shortInput, 10000n);
			expect(result.success).toBe(true);
		});

		it("should truncate long input to 128 bytes", () => {
			// Doc states: padded/truncated to this size
			const longInput = new Uint8Array(256);
			const result = ecrecover(longInput, 10000n);
			expect(result.success).toBe(true);
		});

		it("should accept v values 27 and 28", () => {
			// Doc states: v (recovery id, padded - last byte is 27, 28, 0, or 1)
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const hash = Keccak256.hash(new TextEncoder().encode("test"));
			const sig = Secp256k1.sign(hash, privateKey);

			const input27 = buildEcRecoverInput(hash, 27, sig.r, sig.s);
			const input28 = buildEcRecoverInput(hash, 28, sig.r, sig.s);

			const result27 = ecrecover(input27, 10000n);
			const result28 = ecrecover(input28, 10000n);

			expect(result27.success).toBe(true);
			expect(result28.success).toBe(true);
		});
	});

	describe("Output Format section", () => {
		it("should return 32 bytes with address right-aligned", () => {
			// Doc states: Output 32 bytes (12 zero padding + 20 address)
			const privateKey = new Uint8Array(32);
			privateKey[31] = 5;
			const hash = Keccak256.hash(new TextEncoder().encode("test"));
			const sig = Secp256k1.sign(hash, privateKey);

			const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// First 12 bytes padding
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		});

		it("should return 32 zero bytes for invalid signature", () => {
			// Doc states: Returns 32 zero bytes if signature is invalid
			const input = new Uint8Array(128);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Error Conditions section", () => {
		it("should return zero address for invalid v value (26)", () => {
			// Doc states: Invalid v value (not 0, 1, 27, or 28) -> returns zero address
			const hash = new Uint8Array(32);
			const r = new Uint8Array(32);
			const s = new Uint8Array(32);
			r[31] = 1;
			s[31] = 1;

			const input = buildEcRecoverInput(hash, 26, r, s);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return zero address for r = 0", () => {
			// Doc states: r = 0 or r >= secp256k1_n -> returns zero address
			const hash = new Uint8Array(32);
			const r = new Uint8Array(32); // All zeros
			const s = new Uint8Array(32);
			s[31] = 1;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return zero address for s = 0", () => {
			// Doc states: s = 0 or s > secp256k1_n/2 -> returns zero address
			const hash = new Uint8Array(32);
			const r = new Uint8Array(32);
			const s = new Uint8Array(32); // All zeros
			r[31] = 1;

			const input = buildEcRecoverInput(hash, 27, r, s);
			const result = ecrecover(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should NOT revert for invalid signatures", () => {
			// Doc states: Invalid signatures do NOT revert. They return a zero address
			const input = new Uint8Array(128);
			const result = ecrecover(input, 10000n);

			// Should succeed (not revert) but return zeros
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.ECRECOVER", () => {
			// Doc example uses execute function with PrecompileAddress
			const privateKey = new Uint8Array(32);
			privateKey[31] = 99;
			const hash = Keccak256.hash(new TextEncoder().encode("execute test"));
			const sig = Secp256k1.sign(hash, privateKey);

			const input = buildEcRecoverInput(hash, sig.v, sig.r, sig.s);
			const result = execute(
				PrecompileAddress.ECRECOVER,
				input,
				10000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(3000n);
		});

		it("should be available in FRONTIER hardfork", () => {
			// Doc states: Introduced: Frontier
			const input = new Uint8Array(128);
			const result = execute(
				PrecompileAddress.ECRECOVER,
				input,
				10000n,
				Hardfork.FRONTIER,
			);
			expect(result.success).toBe(true);
		});
	});
});
