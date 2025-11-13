/**
 * Edge case tests for Authorization.process
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import { process } from "./process.js";
import { sign } from "./index.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

function addressToHex(addr: BrandedAddress): string {
	return `0x${Array.from(addr)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

const MAX_UINT64 = 18446744073709551615n;

// ============================================================================
// Valid Authorization Processing Tests
// ============================================================================

describe("Authorization.process - valid authorization", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes valid authorization and returns delegation", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result).toBeDefined();
		expect(result.authority).toBeInstanceOf(Uint8Array);
		expect(result.authority.length).toBe(20);
		expect(result.delegatedAddress).toBe(auth.address);
	});

	it("processes authorization with different chainId", () => {
		const unsigned = {
			chainId: 42n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.authority).toBeInstanceOf(Uint8Array);
		expect(result.delegatedAddress).toBe(auth.address);
	});

	it("processes authorization with large nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: MAX_UINT64,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.authority).toBeInstanceOf(Uint8Array);
		expect(result.delegatedAddress).toBe(auth.address);
	});
});

// ============================================================================
// Authority Recovery Tests
// ============================================================================

describe("Authorization.process - authority recovery", () => {
	it("recovers authority for different delegated addresses", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);

		const unsigned1 = {
			chainId: 1n,
			address: createAddress(10),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 1n,
			address: createAddress(20),
			nonce: 0n,
		};

		const auth1 = sign(unsigned1, privateKey);
		const auth2 = sign(unsigned2, privateKey);

		const result1 = process(auth1);
		const result2 = process(auth2);

		// Both should successfully recover authority
		expect(result1.authority).toBeInstanceOf(Uint8Array);
		expect(result2.authority).toBeInstanceOf(Uint8Array);
		// Different delegated addresses
		expect(result1.delegatedAddress).not.toBe(result2.delegatedAddress);
	});

	it("recovers different authorities for different private keys", () => {
		const privateKey1 = new Uint8Array(32);
		privateKey1.fill(1);
		const privateKey2 = new Uint8Array(32);
		privateKey2.fill(2);

		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};

		const auth1 = sign(unsigned, privateKey1);
		const auth2 = sign(unsigned, privateKey2);

		const result1 = process(auth1);
		const result2 = process(auth2);

		// Different private keys should produce different authorities
		expect(addressToHex(result1.authority)).not.toBe(
			addressToHex(result2.authority),
		);
	});
});

// ============================================================================
// Delegation Address Tests
// ============================================================================

describe("Authorization.process - delegation address", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("returns correct delegated address", () => {
		const delegatedAddr = createAddress(99);
		const unsigned = {
			chainId: 1n,
			address: delegatedAddr,
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.delegatedAddress).toBe(delegatedAddr);
		expect(addressToHex(result.delegatedAddress)).toBe(
			addressToHex(delegatedAddr),
		);
	});

	it("handles zero delegated address", () => {
		const zeroAddr = createAddress(0);
		const unsigned = {
			chainId: 1n,
			address: zeroAddr,
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		// Should throw during validation
		expect(() => process(auth)).toThrow("Address cannot be zero address");
	});

	it("handles max delegated address (0xff...ff)", () => {
		const maxAddr = createAddress(0xff);
		const unsigned = {
			chainId: 1n,
			address: maxAddr,
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.delegatedAddress).toBe(maxAddr);
	});
});

// ============================================================================
// Validation During Processing Tests
// ============================================================================

describe("Authorization.process - validation", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("throws for authorization with chainId = 0", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		expect(() => process(auth)).toThrow("Chain ID must be non-zero");
	});

	it("throws for invalid signature", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		// Corrupt the signature
		auth.r = 0n;
		expect(() => process(auth)).toThrow("Signature r cannot be zero");
	});

	it("throws for malleable signature", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		// Make signature malleable
		auth.s =
			0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n >> 1n;
		auth.s += 1n;
		expect(() => process(auth)).toThrow(
			"Signature s too high (malleable signature)",
		);
	});
});

// ============================================================================
// State Verification Tests
// ============================================================================

describe("Authorization.process - state verification", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("does not modify original authorization", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const originalChainId = auth.chainId;
		const originalNonce = auth.nonce;
		const originalR = auth.r;
		const originalS = auth.s;

		process(auth);

		expect(auth.chainId).toBe(originalChainId);
		expect(auth.nonce).toBe(originalNonce);
		expect(auth.r).toBe(originalR);
		expect(auth.s).toBe(originalS);
	});

	it("returns new delegation object", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result1 = process(auth);
		const result2 = process(auth);

		// Should return different objects (not same reference)
		expect(result1).not.toBe(result2);
		// But with same values
		expect(addressToHex(result1.authority)).toBe(
			addressToHex(result2.authority),
		);
		expect(addressToHex(result1.delegatedAddress)).toBe(
			addressToHex(result2.delegatedAddress),
		);
	});
});

// ============================================================================
// Edge Case Combinations Tests
// ============================================================================

describe("Authorization.process - edge case combinations", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes authorization with max chainId and max nonce", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(1),
			nonce: MAX_UINT64,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.authority).toBeInstanceOf(Uint8Array);
		expect(result.delegatedAddress).toBe(auth.address);
	});

	it("processes authorization with extreme values", () => {
		const unsigned = {
			chainId: 2n ** 256n - 1n,
			address: createAddress(0xff),
			nonce: 2n ** 256n - 1n,
		};
		const auth = sign(unsigned, privateKey);
		const result = process(auth);

		expect(result.authority).toBeInstanceOf(Uint8Array);
		expect(result.delegatedAddress).toBe(auth.address);
	});
});

// ============================================================================
// Multiple Processing Tests
// ============================================================================

describe("Authorization.process - multiple processing", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("can process same authorization multiple times", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);

		const results = Array.from({ length: 10 }, () => process(auth));

		// All results should have same authority
		const authorities = results.map((r) => addressToHex(r.authority));
		const uniqueAuthorities = new Set(authorities);
		expect(uniqueAuthorities.size).toBe(1);

		// All results should have same delegated address
		const delegated = results.map((r) => addressToHex(r.delegatedAddress));
		const uniqueDelegated = new Set(delegated);
		expect(uniqueDelegated.size).toBe(1);
	});
});
