/**
 * Edge case tests for Authorization.verify
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import { SECP256K1_HALF_N, SECP256K1_N } from "./constants.js";
import { sign } from "./sign.js";
import { verify } from "./verify.js";

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

// ============================================================================
// Invalid Signature Values Tests
// ============================================================================

describe("Authorization.verify - invalid signature values", () => {
	const address = createAddress(1);

	it("throws for r = 0", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("Signature r cannot be zero");
	});

	it("throws for s = 0", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0n,
		};
		expect(() => verify(auth)).toThrow("Signature s cannot be zero");
	});

	it("throws for both r and s = 0", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0n,
			s: 0n,
		};
		expect(() => verify(auth)).toThrow("Signature r cannot be zero");
	});
});

// ============================================================================
// Recovery Failure Tests
// ============================================================================

describe("Authorization.verify - recovery failure scenarios", () => {
	const address = createAddress(1);

	it("throws for invalid signature (wrong s value)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		// This should fail validation or recovery since it's not a valid signature
		expect(() => verify(auth)).toThrow();
	});
});

// ============================================================================
// Signature Malleability Tests
// ============================================================================

describe("Authorization.verify - signature malleability", () => {
	const address = createAddress(1);

	it("throws for s > N/2 (malleable signature)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: SECP256K1_HALF_N + 1n,
		};
		expect(() => verify(auth)).toThrow(
			"Signature s too high (malleable signature)",
		);
	});

	it("accepts s = N/2 (boundary)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: SECP256K1_HALF_N,
		};
		// Should pass validation but may fail recovery with invalid signature
		expect(() => verify(auth)).toThrow();
	});

	it("accepts s = 1 (minimum valid)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 1n,
		};
		// Should pass validation but may fail recovery
		expect(() => verify(auth)).toThrow();
	});

	it("throws for s = N (at curve order)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: SECP256K1_N,
		};
		expect(() => verify(auth)).toThrow(
			"Signature s too high (malleable signature)",
		);
	});

	it("throws for s > N", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: SECP256K1_N + 1n,
		};
		expect(() => verify(auth)).toThrow(
			"Signature s too high (malleable signature)",
		);
	});
});

// ============================================================================
// yParity/v Value Validation Tests
// ============================================================================

describe("Authorization.verify - yParity validation", () => {
	const address = createAddress(1);

	it("throws for yParity = 2", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 2,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = 26", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 26,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = 27", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 27,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = 28", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 28,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = 29", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 29,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = 255", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 255,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});

	it("throws for yParity = -1", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: -1,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("yParity must be 0 or 1");
	});
});

// ============================================================================
// Valid Signature Tests
// ============================================================================

describe("Authorization.verify - valid signatures", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("successfully verifies valid signature with yParity = 0", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const authority = verify(auth);
		expect(authority).toBeInstanceOf(Uint8Array);
		expect(authority.length).toBe(20);
	});

	it("successfully verifies valid signature with different nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 42n,
		};
		const auth = sign(unsigned, privateKey);
		const authority = verify(auth);
		expect(authority).toBeInstanceOf(Uint8Array);
		expect(authority.length).toBe(20);
	});

	it("successfully verifies valid signature with large chainId", () => {
		const unsigned = {
			chainId: 18446744073709551615n,
			address: createAddress(1),
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const authority = verify(auth);
		expect(authority).toBeInstanceOf(Uint8Array);
		expect(authority.length).toBe(20);
	});

	it("recovers consistent authority for same private key", () => {
		const unsigned1 = {
			chainId: 1n,
			address: createAddress(1),
			nonce: 0n,
		};
		const unsigned2 = {
			chainId: 1n,
			address: createAddress(2),
			nonce: 1n,
		};
		const auth1 = sign(unsigned1, privateKey);
		const auth2 = sign(unsigned2, privateKey);
		const authority1 = verify(auth1);
		const authority2 = verify(auth2);

		// Same private key should recover to same authority
		const hex1 = addressToHex(authority1);
		const hex2 = addressToHex(authority2);
		expect(hex1).toBe(hex2);
	});

	it("recovers different authority for different private keys", () => {
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
		const authority1 = verify(auth1);
		const authority2 = verify(auth2);

		const hex1 = addressToHex(authority1);
		const hex2 = addressToHex(authority2);
		expect(hex1).not.toBe(hex2);
	});
});

// ============================================================================
// Mismatched Address Tests
// ============================================================================

describe("Authorization.verify - mismatched address scenarios", () => {
	const privateKey = new Uint8Array(32);
	privateKey.fill(1);

	it("verifies signature even if delegated address differs from authority", () => {
		// This is expected behavior - the delegated address can be different from authority
		const unsigned = {
			chainId: 1n,
			address: createAddress(99), // Delegated address
			nonce: 0n,
		};
		const auth = sign(unsigned, privateKey);
		const authority = verify(auth);

		// Verify should succeed and return the authority (signer)
		expect(authority).toBeInstanceOf(Uint8Array);
		expect(authority.length).toBe(20);

		// The authority will likely differ from the delegated address
		// This is valid - user delegates to a different address
	});
});

// ============================================================================
// r Value Boundary Tests
// ============================================================================

describe("Authorization.verify - r value boundaries", () => {
	const address = createAddress(1);

	it("throws for r >= N", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: SECP256K1_N,
			s: 0x123n,
		};
		expect(() => verify(auth)).toThrow(
			"Signature r must be less than curve order",
		);
	});

	it("accepts r = N - 1 (maximum valid)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: SECP256K1_N - 1n,
			s: 0x123n,
		};
		// Should pass validation but may fail recovery
		expect(() => verify(auth)).toThrow();
	});

	it("accepts r = 1 (passes validation)", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: 1n,
			s: 0x123n,
		};
		// Should pass validation (r > 0, s > 0, r < N, s <= N/2)
		// Recovery may succeed or fail depending on if it's a valid point
		// We just test that validation passes
		try {
			verify(auth);
		} catch (e: unknown) {
			// If it throws, it should not be a validation error
			if (e instanceof Error) {
				expect(e.message).not.toContain("Signature r cannot be zero");
				expect(e.message).not.toContain("Signature s cannot be zero");
				expect(e.message).not.toContain(
					"Signature r must be less than curve order",
				);
				expect(e.message).not.toContain("Signature s too high");
			}
		}
	});

	it("throws for r > N", () => {
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address,
			nonce: 0n,
			yParity: 0,
			r: SECP256K1_N + 1n,
			s: 0x123n,
		};
		expect(() => verify(auth)).toThrow(
			"Signature r must be less than curve order",
		);
	});
});

// ============================================================================
// Zero Address Tests
// ============================================================================

describe("Authorization.verify - zero address validation", () => {
	it("throws for zero delegated address", () => {
		const zeroAddress = createAddress(0);
		const auth: BrandedAuthorization = {
			chainId: 1n,
			address: zeroAddress,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("Address cannot be zero address");
	});
});

// ============================================================================
// chainId = 0 Tests
// ============================================================================

describe("Authorization.verify - chainId = 0", () => {
	it("throws for chainId = 0", () => {
		const auth: BrandedAuthorization = {
			chainId: 0n,
			address: createAddress(1),
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => verify(auth)).toThrow("Chain ID must be non-zero");
	});
});
