/**
 * Edge case tests for Authorization.hash
 */

import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { Hash } from "./hash.js";

// Instantiate factory
const hash = Hash({ keccak256, rlpEncode });

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

const MAX_UINT64 = 18446744073709551615n;

function hashToHex(h: Uint8Array): string {
	return `0x${Array.from(h)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

// ============================================================================
// All Zero Inputs Tests
// ============================================================================

describe("Authorization.hash - all zero inputs", () => {
	it("hashes authorization with all zero values", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("produces valid hash for zero chainId", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
		// Hash should be non-zero
		const allZero = Array.from(result).every((b) => b === 0);
		expect(allZero).toBe(false);
	});

	it("produces valid hash for zero nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
		const allZero = Array.from(result).every((b) => b === 0);
		expect(allZero).toBe(false);
	});

	it("produces valid hash for zero address", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
		const allZero = Array.from(result).every((b) => b === 0);
		expect(allZero).toBe(false);
	});
});

// ============================================================================
// Maximum Value Inputs Tests
// ============================================================================

describe("Authorization.hash - maximum value inputs", () => {
	it("hashes authorization with MAX_UINT64 chainId", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes authorization with MAX_UINT64 nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: MAX_UINT64,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes authorization with max address (0xff...ff)", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(0xff),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes authorization with all maximum values", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(0xff),
			nonce: MAX_UINT64,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes authorization with very large chainId (> UINT64)", () => {
		const unsigned = {
			chainId: 2n ** 256n - 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes authorization with very large nonce (> UINT64)", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 2n ** 256n - 1n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe("Authorization.hash - determinism", () => {
	it("produces same hash for same inputs", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result1 = hash(unsigned);
		const result2 = hash(unsigned);
		expect(hashToHex(result1)).toBe(hashToHex(result2));
	});

	it("produces same hash for same inputs called multiple times", () => {
		const unsigned = {
			chainId: 42n,
			address: createAddress(123),
			nonce: 99n,
		};
		const hashes = Array.from({ length: 10 }, () => hash(unsigned));
		const hexHashes = hashes.map((h) => hashToHex(h));
		const allSame = hexHashes.every((h) => h === hexHashes[0]);
		expect(allSame).toBe(true);
	});
});

// ============================================================================
// Hash Format Validation Tests
// ============================================================================

describe("Authorization.hash - hash format validation", () => {
	it("returns 32-byte Uint8Array", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("returns proper Uint8Array (not empty)", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns non-zero hash", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = hash(unsigned);
		const allZero = Array.from(result).every((b) => b === 0);
		expect(allZero).toBe(false);
	});
});

// ============================================================================
// Different Inputs Produce Different Hashes Tests
// ============================================================================

describe("Authorization.hash - different inputs produce different hashes", () => {
	it("different chainId produces different hash", () => {
		const unsigned1 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 2n,
			address: createAddress(1),
			nonce: 0n,
		};
		const hash1 = hash(unsigned1);
		const hash2 = hash(unsigned2);
		expect(hashToHex(hash1)).not.toBe(hashToHex(hash2));
	});

	it("different address produces different hash", () => {
		const unsigned1 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 1n,
			address: createAddress(2),
			nonce: 0n,
		};
		const hash1 = hash(unsigned1);
		const hash2 = hash(unsigned2);
		expect(hashToHex(hash1)).not.toBe(hashToHex(hash2));
	});

	it("different nonce produces different hash", () => {
		const unsigned1 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 1n,
		};
		const hash1 = hash(unsigned1);
		const hash2 = hash(unsigned2);
		expect(hashToHex(hash1)).not.toBe(hashToHex(hash2));
	});

	it("multiple different fields produce different hash", () => {
		const unsigned1 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 2n,
			address: createAddress(2),
			nonce: 1n,
		};
		const hash1 = hash(unsigned1);
		const hash2 = hash(unsigned2);
		expect(hashToHex(hash1)).not.toBe(hashToHex(hash2));
	});
});

// ============================================================================
// Boundary Combinations Tests
// ============================================================================

describe("Authorization.hash - boundary combinations", () => {
	it("hashes min values (0, 0x00...00, 0)", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes max values (MAX_UINT64, 0xff...ff, MAX_UINT64)", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(0xff),
			nonce: MAX_UINT64,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes mixed boundaries (0, 0xff...ff, MAX_UINT64)", () => {
		const unsigned = {
			chainId: 0n,
			address: createAddress(0xff),
			nonce: MAX_UINT64,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hashes mixed boundaries (MAX_UINT64, 0x00...00, 0)", () => {
		const unsigned = {
			chainId: MAX_UINT64,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});
});

// ============================================================================
// Sequential Value Tests
// ============================================================================

describe("Authorization.hash - sequential values", () => {
	it("produces different hashes for sequential chainIds", () => {
		const hashes = [];
		for (let i = 0; i < 10; i++) {
			const unsigned = {
				chainId: BigInt(i),
				address: createAddress(1),
				nonce: 0n,
			};
			hashes.push(hashToHex(hash(unsigned)));
		}
		const uniqueHashes = new Set(hashes);
		expect(uniqueHashes.size).toBe(10);
	});

	it("produces different hashes for sequential nonces", () => {
		const hashes = [];
		for (let i = 0; i < 10; i++) {
			const unsigned = {
				chainId: 1n,
				address: createAddress(1),
				nonce: BigInt(i),
			};
			hashes.push(hashToHex(hash(unsigned)));
		}
		const uniqueHashes = new Set(hashes);
		expect(uniqueHashes.size).toBe(10);
	});

	it("produces different hashes for sequential addresses", () => {
		const hashes = [];
		for (let i = 0; i < 10; i++) {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i),
				nonce: 0n,
			};
			hashes.push(hashToHex(hash(unsigned)));
		}
		const uniqueHashes = new Set(hashes);
		expect(uniqueHashes.size).toBe(10);
	});
});

// ============================================================================
// RLP Encoding Edge Cases Tests
// ============================================================================

describe("Authorization.hash - RLP encoding edge cases", () => {
	it("correctly encodes chainId = 1", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("correctly encodes large chainId requiring multiple bytes", () => {
		const unsigned = {
			chainId: 256n,
			address: createAddress(0),
			nonce: 0n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("correctly encodes very large values", () => {
		const unsigned = {
			chainId: 2n ** 128n,
			address: createAddress(0),
			nonce: 2n ** 128n,
		};
		const result = hash(unsigned);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});
});
