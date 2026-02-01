/**
 * Comprehensive tests for Authorization.format
 */

import { describe, expect, it } from "vitest";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { AuthorizationType } from "./AuthorizationType.js";
import { format } from "./format.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as BrandedAddress;
}

function createAddressFromHex(hex: string): BrandedAddress {
	const bytes = new Uint8Array(20);
	for (let i = 0; i < 20; i++) {
		bytes[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
	}
	return bytes as BrandedAddress;
}

// ============================================================================
// Signed Authorization Formatting Tests
// ============================================================================

describe("Authorization.format - signed authorization", () => {
	it("formats signed authorization with all fields", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		const result = format(auth);
		expect(result).toContain("Authorization");
		expect(result).toContain("chain=1");
		expect(result).toContain("nonce=0");
		expect(result).toContain("v=0");
	});

	it("includes shortened address in format", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddressFromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f51e31",
			),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("0x742d...1e31");
	});

	it("formats large chainId", () => {
		const auth: AuthorizationType = {
			chainId: 424242424242n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 1,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("chain=424242424242");
	});

	it("formats large nonce", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 999999999n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("nonce=999999999");
	});

	it("formats yParity = 0", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("v=0");
	});

	it("formats yParity = 1", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 1,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("v=1");
	});

	it("formats r value as hex", () => {
		const r = new Uint8Array(32);
		r[31] = 0xff;
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toMatch(/r=0x[0-9a-f]+/);
	});

	it("formats s value as hex", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0xaan,
		};
		const result = format(auth);
		expect(result).toMatch(/s=0x[0-9a-f]+/);
	});

	it("formats r with leading zeros", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x100n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("r=0x100");
	});

	it("formats s with leading zeros", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x10000n,
		};
		const result = format(auth);
		expect(result).toContain("s=0x10000");
	});
});

// ============================================================================
// Unsigned Authorization Formatting Tests
// ============================================================================

describe("Authorization.format - unsigned authorization", () => {
	it("formats unsigned authorization without signature fields", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = format(unsigned);
		expect(result).toContain("Authorization");
		expect(result).toContain("chain=1");
		expect(result).toContain("nonce=0");
		expect(result).not.toContain("r=");
		expect(result).not.toContain("s=");
		expect(result).not.toContain("v=");
	});

	it("formats unsigned authorization with large chainId", () => {
		const unsigned = {
			chainId: 424242424242n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = format(unsigned);
		expect(result).toContain("chain=424242424242");
	});

	it("formats unsigned authorization with large nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 999999999n,
		};
		const result = format(unsigned);
		expect(result).toContain("nonce=999999999");
	});

	it("includes shortened address in unsigned format", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddressFromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f51e31",
			),
			nonce: 0n,
		};
		const result = format(unsigned);
		expect(result).toContain("0x742d...1e31");
	});
});

// ============================================================================
// Address Formatting Tests
// ============================================================================

describe("Authorization.format - address formatting", () => {
	it("shortens 20-byte address to first 4 and last 4 hex chars", () => {
		const addr = createAddressFromHex(
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const auth: AuthorizationType = {
			chainId: 1n,
			address: addr,
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("0x1234...5678");
	});

	it("handles zero address", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(0),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("0x0000...0000");
	});

	it("handles max address", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(0xff),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("0xffff...ffff");
	});

	it("formats different addresses differently", () => {
		const auth1: AuthorizationType = {
			chainId: 1n,
			address: createAddress(0x11),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const auth2: AuthorizationType = {
			chainId: 1n,
			address: createAddress(0x22),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result1 = format(auth1);
		const result2 = format(auth2);
		expect(result1).not.toBe(result2);
	});
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("Authorization.format - edge cases", () => {
	it("formats authorization with zero chainId", () => {
		const auth: AuthorizationType = {
			chainId: 0n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("chain=0");
	});

	it("formats authorization with max uint64 chainId", () => {
		const auth: AuthorizationType = {
			chainId: 18446744073709551615n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("chain=18446744073709551615");
	});

	it("formats authorization with max uint64 nonce", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 18446744073709551615n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("nonce=18446744073709551615");
	});

	it("formats authorization with very large chainId beyond uint64", () => {
		const auth: AuthorizationType = {
			chainId: 2n ** 256n - 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("Authorization");
		expect(result).toContain("chain=");
	});

	it("formats authorization with very large nonce beyond uint64", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 2n ** 256n - 1n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("Authorization");
		expect(result).toContain("nonce=");
	});

	it("formats authorization with all zero r", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("r=0x0");
	});

	it("formats authorization with all zero s", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0n,
		};
		const result = format(auth);
		expect(result).toContain("s=0x0");
	});

	it("formats authorization with all max r", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toMatch(/r=0xf+/);
	});

	it("formats authorization with all max s", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		};
		const result = format(auth);
		expect(result).toMatch(/s=0xf+/);
	});
});

// ============================================================================
// Consistency Tests
// ============================================================================

describe("Authorization.format - consistency", () => {
	it("formats same authorization same way multiple times", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 42n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result1 = format(auth);
		const result2 = format(auth);
		const result3 = format(auth);
		expect(result1).toBe(result2);
		expect(result2).toBe(result3);
	});

	it("formats same unsigned authorization same way multiple times", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 42n,
		};
		const result1 = format(unsigned);
		const result2 = format(unsigned);
		const result3 = format(unsigned);
		expect(result1).toBe(result2);
		expect(result2).toBe(result3);
	});

	it("different authorizations produce different formats", () => {
		const auth1: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const auth2: AuthorizationType = {
			chainId: 2n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result1 = format(auth1);
		const result2 = format(auth2);
		expect(result1).not.toBe(result2);
	});
});

// ============================================================================
// String Properties Tests
// ============================================================================

describe("Authorization.format - string properties", () => {
	it("returns non-empty string", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns string type", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(typeof result).toBe("string");
	});

	it("contains all expected parts for signed", () => {
		const auth: AuthorizationType = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x1212121212121212121212121212121212121212121212121212121212121212n,
			s: 0x3434343434343434343434343434343434343434343434343434343434343434n,
		};
		const result = format(auth);
		expect(result).toContain("Authorization(");
		expect(result).toContain("chain=");
		expect(result).toContain("to=");
		expect(result).toContain("nonce=");
		expect(result).toContain("r=");
		expect(result).toContain("s=");
		expect(result).toContain("v=");
		expect(result).toContain(")");
	});

	it("contains all expected parts for unsigned", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const result = format(unsigned);
		expect(result).toContain("Authorization(");
		expect(result).toContain("chain=");
		expect(result).toContain("to=");
		expect(result).toContain("nonce=");
		expect(result).toContain(")");
	});
});
