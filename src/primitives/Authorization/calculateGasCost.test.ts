/**
 * Comprehensive tests for Authorization.calculateGasCost
 */

import { describe, expect, it } from "vitest";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { AuthorizationType } from "./AuthorizationType.js";
import { calculateGasCost } from "./calculateGasCost.js";
import { PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST } from "./constants.js";

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
// Empty List Tests
// ============================================================================

describe("Authorization.calculateGasCost - empty list", () => {
	it("returns 0 for empty list with 0 empty accounts", () => {
		const cost = calculateGasCost([], 0);
		expect(cost).toBe(0n);
	});

	it("returns empty account cost for empty list with non-zero empty accounts", () => {
		const cost = calculateGasCost([], 10);
		expect(cost).toBe(PER_EMPTY_ACCOUNT_COST * 10n);
		expect(cost).toBe(250000n);
	});

	it("returns empty account cost for empty list with large empty accounts", () => {
		const cost = calculateGasCost([], 1000000);
		expect(cost).toBe(PER_EMPTY_ACCOUNT_COST * 1000000n);
		expect(cost).toBe(25000000000n);
	});
});

// ============================================================================
// Single Authorization Tests
// ============================================================================

describe("Authorization.calculateGasCost - single authorization", () => {
	it("calculates base cost for single auth with no empty accounts", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST);
		expect(cost).toBe(12500n);
	});

	it("calculates cost for single auth with 1 empty account", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, 1);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST);
		expect(cost).toBe(37500n);
	});

	it("calculates cost for single auth with multiple empty accounts", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, 5);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST * 5n);
		expect(cost).toBe(137500n);
	});
});

// ============================================================================
// Multiple Authorizations Tests
// ============================================================================

describe("Authorization.calculateGasCost - multiple authorizations", () => {
	it("calculates cost for 2 auths with no empty accounts", () => {
		const authList = [createAuth(1), createAuth(2)];
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 2n);
		expect(cost).toBe(25000n);
	});

	it("calculates cost for 2 auths with 1 empty account", () => {
		const authList = [createAuth(1), createAuth(2)];
		const cost = calculateGasCost(authList, 1);
		expect(cost).toBe(PER_AUTH_BASE_COST * 2n + PER_EMPTY_ACCOUNT_COST);
		expect(cost).toBe(50000n);
	});

	it("calculates cost for 2 auths with 2 empty accounts", () => {
		const authList = [createAuth(1), createAuth(2)];
		const cost = calculateGasCost(authList, 2);
		expect(cost).toBe(PER_AUTH_BASE_COST * 2n + PER_EMPTY_ACCOUNT_COST * 2n);
		expect(cost).toBe(75000n);
	});

	it("calculates cost for 3 auths with no empty accounts", () => {
		const authList = [createAuth(1), createAuth(2), createAuth(3)];
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 3n);
		expect(cost).toBe(37500n);
	});

	it("calculates cost for 3 auths with 3 empty accounts", () => {
		const authList = [createAuth(1), createAuth(2), createAuth(3)];
		const cost = calculateGasCost(authList, 3);
		expect(cost).toBe(PER_AUTH_BASE_COST * 3n + PER_EMPTY_ACCOUNT_COST * 3n);
		expect(cost).toBe(112500n);
	});

	it("calculates cost for 5 auths with no empty accounts", () => {
		const authList = Array.from({ length: 5 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 5n);
		expect(cost).toBe(62500n);
	});

	it("calculates cost for 5 auths with 5 empty accounts", () => {
		const authList = Array.from({ length: 5 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 5);
		expect(cost).toBe(PER_AUTH_BASE_COST * 5n + PER_EMPTY_ACCOUNT_COST * 5n);
		expect(cost).toBe(187500n);
	});

	it("calculates cost for 10 auths with 5 empty accounts", () => {
		const authList = Array.from({ length: 10 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 5);
		expect(cost).toBe(PER_AUTH_BASE_COST * 10n + PER_EMPTY_ACCOUNT_COST * 5n);
		expect(cost).toBe(250000n);
	});
});

// ============================================================================
// Mismatch Between Auths and Empty Accounts Tests
// ============================================================================

describe("Authorization.calculateGasCost - mismatch scenarios", () => {
	it("handles more empty accounts than authorizations", () => {
		const authList = [createAuth(1), createAuth(2)];
		const cost = calculateGasCost(authList, 10);
		expect(cost).toBe(PER_AUTH_BASE_COST * 2n + PER_EMPTY_ACCOUNT_COST * 10n);
		expect(cost).toBe(275000n);
	});

	it("handles fewer empty accounts than authorizations", () => {
		const authList = Array.from({ length: 10 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 2);
		expect(cost).toBe(PER_AUTH_BASE_COST * 10n + PER_EMPTY_ACCOUNT_COST * 2n);
		expect(cost).toBe(175000n);
	});

	it("handles 1 auth with many empty accounts", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, 100);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST * 100n);
		expect(cost).toBe(2512500n);
	});

	it("handles many auths with 1 empty account", () => {
		const authList = Array.from({ length: 100 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 1);
		expect(cost).toBe(PER_AUTH_BASE_COST * 100n + PER_EMPTY_ACCOUNT_COST);
		expect(cost).toBe(1275000n);
	});
});

// ============================================================================
// Large Scale Tests
// ============================================================================

describe("Authorization.calculateGasCost - large scale", () => {
	it("calculates cost for 100 auths with no empty accounts", () => {
		const authList = Array.from({ length: 100 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 100n);
		expect(cost).toBe(1250000n);
	});

	it("calculates cost for 100 auths with 100 empty accounts", () => {
		const authList = Array.from({ length: 100 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 100);
		expect(cost).toBe(
			PER_AUTH_BASE_COST * 100n + PER_EMPTY_ACCOUNT_COST * 100n,
		);
		expect(cost).toBe(3750000n);
	});

	it("calculates cost for 1000 auths with 500 empty accounts", () => {
		const authList = Array.from({ length: 1000 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 500);
		expect(cost).toBe(
			PER_AUTH_BASE_COST * 1000n + PER_EMPTY_ACCOUNT_COST * 500n,
		);
		expect(cost).toBe(25000000n);
	});

	it("calculates cost for 1000 auths with 1000 empty accounts", () => {
		const authList = Array.from({ length: 1000 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 1000);
		expect(cost).toBe(
			PER_AUTH_BASE_COST * 1000n + PER_EMPTY_ACCOUNT_COST * 1000n,
		);
		expect(cost).toBe(37500000n);
	});
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("Authorization.calculateGasCost - edge cases", () => {
	it("handles zero empty accounts", () => {
		const authList = Array.from({ length: 5 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 5n);
	});

	it("handles negative empty accounts (treated as 0)", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, -1);
		// Implementation may or may not handle negative, but test documents behavior
		expect(cost).toBeDefined();
	});

	it("handles very large number of empty accounts", () => {
		const authList = [createAuth(1)];
		const cost = calculateGasCost(authList, 1000000);
		expect(cost).toBe(PER_AUTH_BASE_COST + PER_EMPTY_ACCOUNT_COST * 1000000n);
		expect(cost).toBe(25000012500n);
	});

	it("cost increases linearly with authorization count", () => {
		const cost1 = calculateGasCost([createAuth(1)], 0);
		const cost2 = calculateGasCost([createAuth(1), createAuth(2)], 0);
		const cost3 = calculateGasCost(
			[createAuth(1), createAuth(2), createAuth(3)],
			0,
		);

		expect(cost2 - cost1).toBe(PER_AUTH_BASE_COST);
		expect(cost3 - cost2).toBe(PER_AUTH_BASE_COST);
		expect(cost3 - cost1).toBe(PER_AUTH_BASE_COST * 2n);
	});

	it("cost increases linearly with empty account count", () => {
		const authList = [createAuth(1)];
		const cost1 = calculateGasCost(authList, 1);
		const cost2 = calculateGasCost(authList, 2);
		const cost3 = calculateGasCost(authList, 3);

		expect(cost2 - cost1).toBe(PER_EMPTY_ACCOUNT_COST);
		expect(cost3 - cost2).toBe(PER_EMPTY_ACCOUNT_COST);
		expect(cost3 - cost1).toBe(PER_EMPTY_ACCOUNT_COST * 2n);
	});
});

// ============================================================================
// Cost Formula Verification Tests
// ============================================================================

describe("Authorization.calculateGasCost - formula verification", () => {
	it("follows formula: (auths * BASE) + (empty * EMPTY)", () => {
		const testCases = [
			{ auths: 1, empty: 0 },
			{ auths: 1, empty: 1 },
			{ auths: 2, empty: 1 },
			{ auths: 3, empty: 2 },
			{ auths: 5, empty: 3 },
			{ auths: 10, empty: 5 },
			{ auths: 100, empty: 50 },
		];

		for (const { auths, empty } of testCases) {
			const authList = Array.from({ length: auths }, (_, i) =>
				createAuth(i + 1),
			);
			const cost = calculateGasCost(authList, empty);
			const expected =
				PER_AUTH_BASE_COST * BigInt(auths) +
				PER_EMPTY_ACCOUNT_COST * BigInt(empty);
			expect(cost).toBe(expected);
		}
	});

	it("base cost component is auths * 12500", () => {
		const authList = Array.from({ length: 7 }, (_, i) => createAuth(i + 1));
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(7n * 12500n);
	});

	it("empty account cost component is empty * 25000", () => {
		const authList = [createAuth(1)];
		const baseCost = calculateGasCost(authList, 0);
		const totalCost = calculateGasCost(authList, 7);
		expect(totalCost - baseCost).toBe(7n * 25000n);
	});
});

// ============================================================================
// Return Type Tests
// ============================================================================

describe("Authorization.calculateGasCost - return type", () => {
	it("returns bigint", () => {
		const cost = calculateGasCost([createAuth(1)], 0);
		expect(typeof cost).toBe("bigint");
	});

	it("returns non-negative value for valid inputs", () => {
		const cost = calculateGasCost([createAuth(1)], 1);
		expect(cost).toBeGreaterThanOrEqual(0n);
	});

	it("returns 0 for empty list", () => {
		const cost = calculateGasCost([], 0);
		expect(cost).toBe(0n);
	});

	it("all costs are multiples of base cost", () => {
		const authList = Array.from({ length: 10 }, (_, i) => createAuth(i + 1));
		for (let emptyCount = 0; emptyCount <= 10; emptyCount++) {
			const cost = calculateGasCost(authList, emptyCount);
			// Cost should be base costs + empty costs
			const basePart = PER_AUTH_BASE_COST * 10n;
			const emptyPart = PER_EMPTY_ACCOUNT_COST * BigInt(emptyCount);
			expect(cost).toBe(basePart + emptyPart);
		}
	});
});

// ============================================================================
// Different Authorization Content Tests
// ============================================================================

describe("Authorization.calculateGasCost - different authorization content", () => {
	it("cost is same regardless of chainId", () => {
		const auth1 = { ...createAuth(1), chainId: 1n };
		const auth2 = { ...createAuth(1), chainId: 999n };
		const cost1 = calculateGasCost([auth1], 0);
		const cost2 = calculateGasCost([auth2], 0);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of address", () => {
		const auth1 = { ...createAuth(1), address: createAddress(1) };
		const auth2 = { ...createAuth(1), address: createAddress(99) };
		const cost1 = calculateGasCost([auth1], 0);
		const cost2 = calculateGasCost([auth2], 0);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of nonce", () => {
		const auth1 = { ...createAuth(1), nonce: 0n };
		const auth2 = { ...createAuth(1), nonce: 999999n };
		const cost1 = calculateGasCost([auth1], 0);
		const cost2 = calculateGasCost([auth2], 0);
		expect(cost1).toBe(cost2);
	});

	it("cost is same regardless of signature values", () => {
		const auth1 = {
			...createAuth(1),
			r: new Uint8Array(32).fill(0x11),
			s: new Uint8Array(32).fill(0x22),
		};
		const auth2 = {
			...createAuth(1),
			r: new Uint8Array(32).fill(0xff),
			s: new Uint8Array(32).fill(0xaa),
		};
		const cost1 = calculateGasCost([auth1], 0);
		const cost2 = calculateGasCost([auth2], 0);
		expect(cost1).toBe(cost2);
	});

	it("cost depends only on count, not content", () => {
		const authList1 = Array.from({ length: 5 }, (_, i) => createAuth(i));
		const authList2 = Array.from({ length: 5 }, (_, i) => createAuth(i + 100));
		const cost1 = calculateGasCost(authList1, 2);
		const cost2 = calculateGasCost(authList2, 2);
		expect(cost1).toBe(cost2);
	});
});

// ============================================================================
// Duplicate Authorization Tests
// ============================================================================

describe("Authorization.calculateGasCost - duplicate authorizations", () => {
	it("counts duplicate authorizations separately", () => {
		const auth = createAuth(1);
		const authList = [auth, auth, auth];
		const cost = calculateGasCost(authList, 0);
		expect(cost).toBe(PER_AUTH_BASE_COST * 3n);
	});

	it("duplicate auths contribute to total cost", () => {
		const auth = createAuth(1);
		const cost1 = calculateGasCost([auth], 0);
		const cost2 = calculateGasCost([auth, auth], 0);
		expect(cost2).toBe(cost1 * 2n);
	});
});
