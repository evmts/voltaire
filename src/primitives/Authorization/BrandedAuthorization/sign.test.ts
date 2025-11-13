/**
 * Edge case tests for Authorization.sign
 */

import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../../../crypto/Secp256k1/recoverPublicKey.js";
import { sign as secp256k1Sign } from "../../../crypto/Secp256k1/sign.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import { FromPublicKey } from "../../Address/BrandedAddress/fromPublicKey.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { Sign } from "./sign.js";

// Create address factory
const addressFromPublicKey = FromPublicKey({ keccak256 });

// Instantiate factory
const sign = Sign({
	keccak256,
	rlpEncode,
	sign: secp256k1Sign,
	recoverPublicKey,
	addressFromPublicKey,
});

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

const MAX_UINT64 = 18446744073709551615n;

// ============================================================================
// Invalid Private Key Tests
// ============================================================================

describe("Authorization.sign - invalid private key lengths", () => {
	const unsigned = {
		chainId: 1n,
		address: createAddress(1),
		nonce: 0n,
	};

	it("throws with 0-byte private key", () => {
		const privateKey = new Uint8Array(0);
		expect(() => sign(unsigned, privateKey)).toThrow();
	});

	it("throws with 16-byte private key", () => {
		const privateKey = new Uint8Array(16);
		privateKey.fill(1);
		expect(() => sign(unsigned, privateKey)).toThrow();
	});

	it("throws with 31-byte private key", () => {
		const privateKey = new Uint8Array(31);
		privateKey.fill(1);
		expect(() => sign(unsigned, privateKey)).toThrow();
	});

	it("throws with 33-byte private key", () => {
		const privateKey = new Uint8Array(33);
		privateKey.fill(1);
		expect(() => sign(unsigned, privateKey)).toThrow();
	});

	it("throws with 64-byte private key", () => {
		const privateKey = new Uint8Array(64);
		privateKey.fill(1);
		expect(() => sign(unsigned, privateKey)).toThrow();
	});

	it("accepts valid 32-byte private key", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);
		const result = sign(unsigned, privateKey);
		expect(result).toBeDefined();
		expect(result.yParity).toBeGreaterThanOrEqual(0);
		expect(result.yParity).toBeLessThanOrEqual(1);
	});
});

// ============================================================================
// Chain ID Boundary Tests
// ============================================================================

describe("Authorization.sign - chainId boundaries", () => {
	const address = createAddress(1);
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("signs with chainId = 1n", () => {
		const unsigned = { chainId: 1n, address, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(1n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with chainId = 0n", () => {
		const unsigned = { chainId: 0n, address, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(0n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with chainId = MAX_UINT64", () => {
		const unsigned = { chainId: MAX_UINT64, address, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(MAX_UINT64);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with very large chainId", () => {
		const unsigned = { chainId: 2n ** 256n - 1n, address, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(2n ** 256n - 1n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});
});

// ============================================================================
// Nonce Boundary Tests
// ============================================================================

describe("Authorization.sign - nonce boundaries", () => {
	const address = createAddress(1);
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("signs with nonce = 0n", () => {
		const unsigned = { chainId: 1n, address, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.nonce).toBe(0n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with nonce = 1n", () => {
		const unsigned = { chainId: 1n, address, nonce: 1n };
		const result = sign(unsigned, privateKey);
		expect(result.nonce).toBe(1n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with nonce = MAX_UINT64", () => {
		const unsigned = { chainId: 1n, address, nonce: MAX_UINT64 };
		const result = sign(unsigned, privateKey);
		expect(result.nonce).toBe(MAX_UINT64);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with very large nonce", () => {
		const unsigned = { chainId: 1n, address, nonce: 2n ** 256n - 1n };
		const result = sign(unsigned, privateKey);
		expect(result.nonce).toBe(2n ** 256n - 1n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("different nonces produce different signatures", () => {
		const unsigned1 = { chainId: 1n, address, nonce: 0n };
		const unsigned2 = { chainId: 1n, address, nonce: 1n };
		const result1 = sign(unsigned1, privateKey);
		const result2 = sign(unsigned2, privateKey);
		expect(result1.r !== result2.r || result1.s !== result2.s).toBe(true);
	});
});

// ============================================================================
// Address Boundary Tests
// ============================================================================

describe("Authorization.sign - address boundaries", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("signs with zero address", () => {
		const zeroAddress = createAddress(0);
		const unsigned = { chainId: 1n, address: zeroAddress, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.address).toBe(zeroAddress);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("signs with max address (0xff...ff)", () => {
		const maxAddress = createAddress(0xff);
		const unsigned = { chainId: 1n, address: maxAddress, nonce: 0n };
		const result = sign(unsigned, privateKey);
		expect(result.address).toBe(maxAddress);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("different addresses produce different signatures", () => {
		const addr1 = createAddress(1);
		const addr2 = createAddress(2);
		const unsigned1 = { chainId: 1n, address: addr1, nonce: 0n };
		const unsigned2 = { chainId: 1n, address: addr2, nonce: 0n };
		const result1 = sign(unsigned1, privateKey);
		const result2 = sign(unsigned2, privateKey);
		expect(result1.r !== result2.r || result1.s !== result2.s).toBe(true);
	});
});

// ============================================================================
// All-Zero Inputs Tests
// ============================================================================

describe("Authorization.sign - all-zero inputs", () => {
	it("signs with all zero values", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);
		const unsigned = {
			chainId: 0n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(0n);
		expect(result.nonce).toBe(0n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
		expect([0, 1]).toContain(result.yParity);
	});
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe("Authorization.sign - determinism", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);
	const unsigned = {
		chainId: 1n,
		address: createAddress(1),
		nonce: 0n,
	};

	it("produces consistent signatures for same inputs", () => {
		const result1 = sign(unsigned, privateKey);
		const result2 = sign(unsigned, privateKey);
		expect(result1.r).toBe(result2.r);
		expect(result1.s).toBe(result2.s);
		expect(result1.yParity).toBe(result2.yParity);
	});

	it("different private keys produce different signatures", () => {
		const privateKey1 = new Uint8Array(32);
		privateKey1.fill(1);
		const privateKey2 = new Uint8Array(32);
		privateKey2.fill(2);
		const result1 = sign(unsigned, privateKey1);
		const result2 = sign(unsigned, privateKey2);
		expect(result1.r !== result2.r || result1.s !== result2.s).toBe(true);
	});
});

// ============================================================================
// Signature Format Tests
// ============================================================================

describe("Authorization.sign - signature format", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);
	const unsigned = {
		chainId: 1n,
		address: createAddress(1),
		nonce: 0n,
	};

	it("returns valid yParity (0 or 1)", () => {
		const result = sign(unsigned, privateKey);
		expect([0, 1]).toContain(result.yParity);
	});

	it("returns non-zero r", () => {
		const result = sign(unsigned, privateKey);
		expect(result.r).toBeGreaterThan(0n);
	});

	it("returns non-zero s", () => {
		const result = sign(unsigned, privateKey);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("preserves original unsigned fields", () => {
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(unsigned.chainId);
		expect(result.address).toBe(unsigned.address);
		expect(result.nonce).toBe(unsigned.nonce);
	});
});

// ============================================================================
// Edge Case Combinations
// ============================================================================

describe("Authorization.sign - edge case combinations", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("handles max chainId + max nonce + max address", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(0xff),
			nonce: MAX_UINT64,
		};
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(MAX_UINT64);
		expect(result.nonce).toBe(MAX_UINT64);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});

	it("handles min chainId + min nonce + zero address", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = sign(unsigned, privateKey);
		expect(result.chainId).toBe(0n);
		expect(result.nonce).toBe(0n);
		expect(result.r).toBeGreaterThan(0n);
		expect(result.s).toBeGreaterThan(0n);
	});
});
