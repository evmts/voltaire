/**
 * Edge case tests for Authorization.processAll
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import { processAll } from "./processAll.js";
import { sign } from "./sign.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

function addressToHex(addr: BrandedAddress): string {
	return (
		"0x" +
		Array.from(addr)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

const MAX_UINT64 = 18446744073709551615n;

// ============================================================================
// Empty Array Tests
// ============================================================================

describe("Authorization.processAll - empty array", () => {
	it("returns empty array for empty input", () => {
		const result = processAll([]);
		expect(result).toEqual([]);
		expect(result.length).toBe(0);
	});
});

// ============================================================================
// Single Authorization Tests
// ============================================================================

describe("Authorization.processAll - single authorization", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes single valid authorization", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const result = processAll([auth]);

		expect(result.length).toBe(1);
		expect(result[0]).toBeDefined();
		expect(result[0].authority).toBeInstanceOf(Uint8Array);
		expect(result[0].delegatedAddress).toBe(auth.address);
	});

	it("throws for single invalid authorization", () => {
		const auth: BrandedAuthorization = {
			chainId: 0n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => processAll([auth])).toThrow("Chain ID must be non-zero");
	});
});

// ============================================================================
// Multiple Valid Authorizations Tests
// ============================================================================

describe("Authorization.processAll - multiple valid authorizations", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes multiple authorizations", () => {
		const auths = Array.from({ length: 5 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i + 1),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(5);
		result.forEach((delegation, i) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
			expect(delegation.delegatedAddress).toBe(auths[i].address);
		});
	});

	it("processes authorizations from same private key with different addresses", () => {
		const auths = Array.from({ length: 5 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i + 1),
				nonce: 0n,
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		// All should successfully process
		expect(result.length).toBe(5);
		result.forEach((delegation) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
		});
	});

	it("authorizations from different private keys have different authorities", () => {
		const auths = Array.from({ length: 5 }, (_, i) => {
			const pk = new Uint8Array(32);
			pk.fill(i + 1);
			const unsigned = {
				chainId: 1n,
				address: createAddress(1),
				nonce: 0n,
			};
			return sign(unsigned, pk);
		});

		const result = processAll(auths);

		const authorities = result.map((r) => addressToHex(r.authority));
		const uniqueAuthorities = new Set(authorities);
		expect(uniqueAuthorities.size).toBe(5);
	});
});

// ============================================================================
// Mix of Valid and Invalid Tests
// ============================================================================

describe("Authorization.processAll - mix of valid and invalid", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("throws on first invalid authorization", () => {
		const validAuth = sign(
			{
				chainId: 1n,
				address: createAddress(1),
				nonce: 0n,
			},
			privateKey,
		);

		const invalidAuth: BrandedAuthorization = {
			chainId: 0n,
			address: createAddress(2),
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};

		expect(() => processAll([validAuth, invalidAuth])).toThrow(
			"Chain ID must be non-zero",
		);
	});

	it("throws on invalid authorization in middle of list", () => {
		const validAuth1 = sign(
			{
				chainId: 1n,
				address: createAddress(1),
				nonce: 0n,
			},
			privateKey,
		);
		const validAuth2 = sign(
			{
				chainId: 1n,
				address: createAddress(2),
				nonce: 1n,
			},
			privateKey,
		);
		const invalidAuth: BrandedAuthorization = {
			chainId: 1n,
			address: createAddress(3),
			nonce: 0n,
			yParity: 0,
			r: 0n,
			s: 0x456n,
		};

		expect(() => processAll([validAuth1, invalidAuth, validAuth2])).toThrow(
			"Signature r cannot be zero",
		);
	});
});

// ============================================================================
// Duplicate Authorizations Tests
// ============================================================================

describe("Authorization.processAll - duplicate authorizations", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes duplicate authorizations", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const auths = [auth, auth, auth];

		const result = processAll(auths);

		expect(result.length).toBe(3);
		const authorities = result.map((r) => addressToHex(r.authority));
		const uniqueAuthorities = new Set(authorities);
		expect(uniqueAuthorities.size).toBe(1);

		const delegated = result.map((r) => addressToHex(r.delegatedAddress));
		const uniqueDelegated = new Set(delegated);
		expect(uniqueDelegated.size).toBe(1);
	});

	it("processes authorizations with same delegated address but different nonces", () => {
		const auths = Array.from({ length: 3 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(1), // Same delegated address
				nonce: BigInt(i), // Different nonces
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(3);
		const delegated = result.map((r) => addressToHex(r.delegatedAddress));
		const uniqueDelegated = new Set(delegated);
		expect(uniqueDelegated.size).toBe(1);
	});
});

// ============================================================================
// Max Batch Size Tests
// ============================================================================

describe("Authorization.processAll - max batch size scenarios", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes 10 authorizations", () => {
		const auths = Array.from({ length: 10 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i + 1),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(10);
		result.forEach((delegation, i) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
			expect(delegation.delegatedAddress).toBe(auths[i].address);
		});
	});

	it("processes 100 authorizations", () => {
		const auths = Array.from({ length: 100 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress((i % 256) + 1),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(100);
		result.forEach((delegation, i) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
			expect(delegation.delegatedAddress).toBe(auths[i].address);
		});
	});

	it("processes 1000 authorizations", () => {
		const auths = Array.from({ length: 1000 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress((i % 255) + 1), // +1 to skip 0
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(1000);
		// Verify first and last
		expect(result[0].authority).toBeInstanceOf(Uint8Array);
		expect(result[999].authority).toBeInstanceOf(Uint8Array);
	});
});

// ============================================================================
// Edge Case Values Tests
// ============================================================================

describe("Authorization.processAll - edge case values", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes authorizations with max chainId", () => {
		const auths = Array.from({ length: 3 }, (_, i) => {
			const unsigned = {
				chainId: MAX_UINT64,
				address: createAddress(i + 1),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(3);
		result.forEach((delegation) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
		});
	});

	it("processes authorizations with max nonce", () => {
		const auths = Array.from({ length: 3 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i + 1),
				nonce: MAX_UINT64,
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(3);
		result.forEach((delegation) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
		});
	});

	it("processes authorizations with max address", () => {
		const auths = Array.from({ length: 3 }, (_, i) => {
			const unsigned = {
				chainId: BigInt(i + 1),
				address: createAddress(0xff),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(3);
		result.forEach((delegation) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
			expect(addressToHex(delegation.delegatedAddress)).toBe(
				addressToHex(createAddress(0xff)),
			);
		});
	});
});

// ============================================================================
// Order Preservation Tests
// ============================================================================

describe("Authorization.processAll - order preservation", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("preserves order of authorizations", () => {
		const auths = Array.from({ length: 10 }, (_, i) => {
			const unsigned = {
				chainId: 1n,
				address: createAddress(i + 1),
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(10);
		result.forEach((delegation, i) => {
			expect(addressToHex(delegation.delegatedAddress)).toBe(
				addressToHex(auths[i].address),
			);
		});
	});

	it("maintains order with mixed addresses", () => {
		const addresses = [1, 5, 3, 9, 2, 7].map((b) => createAddress(b));
		const auths = addresses.map((addr, i) => {
			const unsigned = {
				chainId: 1n,
				address: addr,
				nonce: BigInt(i),
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(6);
		result.forEach((delegation, i) => {
			expect(addressToHex(delegation.delegatedAddress)).toBe(
				addressToHex(addresses[i]),
			);
		});
	});
});

// ============================================================================
// Different Chain IDs Tests
// ============================================================================

describe("Authorization.processAll - different chain IDs", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("processes authorizations from different chains", () => {
		const chainIds = [1n, 137n, 42161n, 10n, 8453n];
		const auths = chainIds.map((chainId, i) => {
			const unsigned = {
				chainId,
				address: createAddress(i + 1),
				nonce: 0n,
			};
			return sign(unsigned, privateKey);
		});

		const result = processAll(auths);

		expect(result.length).toBe(5);
		result.forEach((delegation) => {
			expect(delegation.authority).toBeInstanceOf(Uint8Array);
		});
	});
});
