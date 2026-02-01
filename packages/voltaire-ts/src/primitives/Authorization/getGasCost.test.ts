/**
 * Comprehensive tests for Authorization.getGasCost
 */

import { describe, expect, it } from "vitest";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { AuthorizationType } from "./AuthorizationType.js";
import { PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST } from "./constants.js";
import { getGasCost } from "./getGasCost.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

function createAuth(index: number): AuthorizationType {
	return {
		chainId: 1n,
		address: createAddress(index),
		nonce: BigInt(index),
		yParity: index % 2,
		r: new Uint8Array(32).fill(index),
		s: new Uint8Array(32).fill(index + 1),
	};
}

// ============================================================================
// Basic Cost Tests
// ============================================================================

describe("Authorization.getGasCost - basic cost", () => {
	it("returns base cost when account is not empty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
		expect(cost).toBe(12500n);
	});

	it("returns base + empty cost when account is empty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
		expect(cost).toBe(37500n);
	});
});

// ============================================================================
// isEmpty Parameter Tests
// ============================================================================

describe("Authorization.getGasCost - isEmpty parameter", () => {
	it("isEmpty=false returns only base cost", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("isEmpty=true adds empty account cost", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
	});

	it("difference between isEmpty true and false is empty account cost", () => {
		const auth = createAuth(1);
		const costNotEmpty = getGasCost(auth, false);
		const costEmpty = getGasCost(auth, true);
		expect(costEmpty - costNotEmpty).toBe(PER_EMPTY_ACCOUNT_COST);
		expect(costEmpty - costNotEmpty).toBe(25000n);
	});
});

// ============================================================================
// Different Authorization Content Tests
// ============================================================================

describe("Authorization.getGasCost - different authorization content", () => {
	it("cost is same regardless of chainId when not empty", () => {
		const auth1 = { ...createAuth(1), chainId: 1n };
		const auth2 = { ...createAuth(1), chainId: 999n };
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of chainId when empty", () => {
		const auth1 = { ...createAuth(1), chainId: 1n };
		const auth2 = { ...createAuth(1), chainId: 999n };
		const cost1 = getGasCost(auth1, true);
		const cost2 = getGasCost(auth2, true);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of address when not empty", () => {
		const auth1 = { ...createAuth(1), address: createAddress(1) };
		const auth2 = { ...createAuth(1), address: createAddress(99) };
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of address when empty", () => {
		const auth1 = { ...createAuth(1), address: createAddress(1) };
		const auth2 = { ...createAuth(1), address: createAddress(99) };
		const cost1 = getGasCost(auth1, true);
		const cost2 = getGasCost(auth2, true);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of nonce", () => {
		const auth1 = { ...createAuth(1), nonce: 0n };
		const auth2 = { ...createAuth(1), nonce: 999999n };
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of yParity", () => {
		const auth1 = { ...createAuth(1), yParity: 0 };
		const auth2 = { ...createAuth(1), yParity: 1 };
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of r value", () => {
		const auth1 = {
			...createAuth(1),
			r: new Uint8Array(32).fill(0x11),
		};
		const auth2 = {
			...createAuth(1),
			r: new Uint8Array(32).fill(0xff),
		};
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of s value", () => {
		const auth1 = {
			...createAuth(1),
			s: new Uint8Array(32).fill(0x11),
		};
		const auth2 = {
			...createAuth(1),
			s: new Uint8Array(32).fill(0xff),
		};
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});

	it("cost depends only on isEmpty flag", () => {
		const auth1 = createAuth(1);
		const auth2 = createAuth(99);
		expect(getGasCost(auth1, false)).toBe(getGasCost(auth2, false));
		expect(getGasCost(auth1, true)).toBe(getGasCost(auth2, true));
	});
});

// ============================================================================
// Edge Case Authorization Values Tests
// ============================================================================

describe("Authorization.getGasCost - edge case values", () => {
	it("handles authorization with zero chainId", () => {
		const auth = { ...createAuth(1), chainId: 0n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with max uint64 chainId", () => {
		const auth = { ...createAuth(1), chainId: 18446744073709551615n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with very large chainId", () => {
		const auth = { ...createAuth(1), chainId: 2n ** 256n - 1n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with zero nonce", () => {
		const auth = { ...createAuth(1), nonce: 0n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with max uint64 nonce", () => {
		const auth = { ...createAuth(1), nonce: 18446744073709551615n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with very large nonce", () => {
		const auth = { ...createAuth(1), nonce: 2n ** 256n - 1n };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with zero address", () => {
		const auth = { ...createAuth(1), address: createAddress(0) };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with max address", () => {
		const auth = { ...createAuth(1), address: createAddress(0xff) };
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with all zero r", () => {
		const auth = {
			...createAuth(1),
			r: new Uint8Array(32),
		};
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with all max r", () => {
		const auth = {
			...createAuth(1),
			r: new Uint8Array(32).fill(0xff),
		};
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with all zero s", () => {
		const auth = {
			...createAuth(1),
			s: new Uint8Array(32),
		};
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("handles authorization with all max s", () => {
		const auth = {
			...createAuth(1),
			s: new Uint8Array(32).fill(0xff),
		};
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});
});

// ============================================================================
// Return Type Tests
// ============================================================================

describe("Authorization.getGasCost - return type", () => {
	it("returns bigint", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(typeof cost).toBe("bigint");
	});

	it("returns positive value for not empty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBeGreaterThan(0n);
	});

	it("returns positive value for empty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBeGreaterThan(0n);
	});

	it("empty cost is greater than not empty cost", () => {
		const auth = createAuth(1);
		const costNotEmpty = getGasCost(auth, false);
		const costEmpty = getGasCost(auth, true);
		expect(costEmpty).toBeGreaterThan(costNotEmpty);
	});
});

// ============================================================================
// Consistency Tests
// ============================================================================

describe("Authorization.getGasCost - consistency", () => {
	it("returns same cost for same auth and isEmpty", () => {
		const auth = createAuth(1);
		const cost1 = getGasCost(auth, false);
		const cost2 = getGasCost(auth, false);
		const cost3 = getGasCost(auth, false);
		expect(cost1).toBe(cost2);
		expect(cost2).toBe(cost3);
	});

	it("returns consistent cost across multiple calls", () => {
		const auth = createAuth(1);
		const costs = Array.from({ length: 10 }, () => getGasCost(auth, false));
		const uniqueCosts = new Set(costs);
		expect(uniqueCosts.size).toBe(1);
	});

	it("empty flag consistently affects cost", () => {
		const auth = createAuth(1);
		const costsFalse = Array.from({ length: 5 }, () => getGasCost(auth, false));
		const costsTrue = Array.from({ length: 5 }, () => getGasCost(auth, true));

		const uniqueFalse = new Set(costsFalse);
		const uniqueTrue = new Set(costsTrue);

		expect(uniqueFalse.size).toBe(1);
		expect(uniqueTrue.size).toBe(1);
		expect([...uniqueTrue][0] - [...uniqueFalse][0]).toBe(
			PER_EMPTY_ACCOUNT_COST,
		);
	});
});

// ============================================================================
// Cost Formula Verification Tests
// ============================================================================

describe("Authorization.getGasCost - formula verification", () => {
	it("not empty cost equals PER_AUTH_BASE_COST", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("empty cost equals BASE + EMPTY", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
	});

	it("follows formula: BASE + (isEmpty ? EMPTY : 0)", () => {
		const auth = createAuth(1);
		const costNotEmpty = getGasCost(auth, false);
		const costEmpty = getGasCost(auth, true);

		expect(costNotEmpty).toBe(PER_AUTH_BASE_COST);
		expect(costEmpty).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
	});

	it("base cost is 12500", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBe(12500n);
	});

	it("empty account cost is 25000", () => {
		const auth = createAuth(1);
		const costNotEmpty = getGasCost(auth, false);
		const costEmpty = getGasCost(auth, true);
		expect(costEmpty - costNotEmpty).toBe(25000n);
	});

	it("total empty cost is 37500", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBe(37500n);
	});
});

// ============================================================================
// Multiple Authorization Comparison Tests
// ============================================================================

describe("Authorization.getGasCost - multiple authorization comparison", () => {
	it("all authorizations have same not empty cost", () => {
		const auths = Array.from({ length: 10 }, (_, i) => createAuth(i + 1));
		const costs = auths.map((auth) => getGasCost(auth, false));
		const uniqueCosts = new Set(costs);
		expect(uniqueCosts.size).toBe(1);
		expect([...uniqueCosts][0]).toBe(PER_AUTH_BASE_COST);
	});

	it("all authorizations have same empty cost", () => {
		const auths = Array.from({ length: 10 }, (_, i) => createAuth(i + 1));
		const costs = auths.map((auth) => getGasCost(auth, true));
		const uniqueCosts = new Set(costs);
		expect(uniqueCosts.size).toBe(1);
		expect([...uniqueCosts][0]).toBe(
			PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST,
		);
	});

	it("cost per authorization is independent", () => {
		const auth1 = createAuth(1);
		const auth2 = createAuth(2);
		const cost1 = getGasCost(auth1, false);
		const cost2 = getGasCost(auth2, false);
		expect(cost1).toBe(cost2);
	});
});

// ============================================================================
// Boolean Coercion Tests
// ============================================================================

describe("Authorization.getGasCost - boolean isEmpty handling", () => {
	it("explicitly false isEmpty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, false);
		expect(cost).toBe(PER_AUTH_BASE_COST);
	});

	it("explicitly true isEmpty", () => {
		const auth = createAuth(1);
		const cost = getGasCost(auth, true);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
	});
});

// ============================================================================
// Same Authorization Different isEmpty Tests
// ============================================================================

describe("Authorization.getGasCost - same auth different isEmpty", () => {
	it("same authorization returns different costs for different isEmpty", () => {
		const auth = createAuth(1);
		const costNotEmpty = getGasCost(auth, false);
		const costEmpty = getGasCost(auth, true);
		expect(costNotEmpty).not.toBe(costEmpty);
		expect(costEmpty).toBeGreaterThan(costNotEmpty);
	});

	it("calling with both isEmpty values gives expected results", () => {
		const auth = createAuth(1);
		const results = [
			getGasCost(auth, false),
			getGasCost(auth, true),
			getGasCost(auth, false),
			getGasCost(auth, true),
		];

		expect(results[0]).toBe(results[2]);
		expect(results[1]).toBe(results[3]);
		expect(results[0]).not.toBe(results[1]);
	});
});
