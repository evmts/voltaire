import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { fromPublicKey } from "./fromPublicKey.js";

describe("fromPublicKey", () => {
	describe("valid public key coordinates", () => {
		it("creates Address from valid secp256k1 public key", () => {
			// Test vector from known address derivation
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr = fromPublicKey(x, y);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("creates Address with known test vector", () => {
			// Known Ethereum keypair test vector
			// Public key: 0x04...
			// Address should be last 20 bytes of keccak256(pubkey)
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr = fromPublicKey(x, y);
			// Verify it's a valid address
			expect(Address.is(addr)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("handles zero coordinates", () => {
			const addr = fromPublicKey(0n, 0n);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("handles max value coordinates", () => {
			const maxVal =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const addr = fromPublicKey(maxVal, maxVal);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("handles small coordinates", () => {
			const addr = fromPublicKey(1n, 1n);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});
	});

	describe("deterministic output", () => {
		it("produces same address for same coordinates", () => {
			const x = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
			const y = 0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;
			const addr1 = fromPublicKey(x, y);
			const addr2 = fromPublicKey(x, y);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("produces different addresses for different coordinates", () => {
			const x1 = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
			const y1 = 0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;
			const x2 = 0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;
			const y2 = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
			const addr1 = fromPublicKey(x1, y1);
			const addr2 = fromPublicKey(x2, y2);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});
	});

	it("works with Address namespace method", () => {
		const x = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
		const y = 0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;
		const addr = Address.fromPublicKey(x, y);
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});
});
