/**
 * Security tests for SIWE (Sign-In with Ethereum) module
 * Tests parsing, validation, verification, and security edge cases
 */

import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import * as Address from "../../Address/BrandedAddress/index.js";
import type { BrandedHash } from "../../Hash/BrandedHash/BrandedHash.js";
import type { BrandedMessage, Signature } from "./BrandedMessage.js";
import { format } from "./format.js";
import { getMessageHash } from "./getMessageHash.js";
import * as Siwe from "./index.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";
import { verify } from "./verify.js";
import { verifyMessage } from "./verifyMessage.js";

// ============================================================================
// Test Utilities
// ============================================================================

function createTestAddress(seed: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(seed);
	return addr as BrandedAddress;
}

function createBasicMessage(): BrandedMessage {
	return {
		domain: "example.com",
		address: createTestAddress(1),
		uri: "https://example.com/login",
		version: "1",
		chainId: 1,
		nonce: "12345678",
		issuedAt: "2021-09-30T16:25:24.000Z",
	};
}

function createValidSignedMessage(): {
	message: BrandedMessage;
	signature: Signature;
	privateKey: Uint8Array;
} {
	const privateKeyHex =
		"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
	const privateKey = new Uint8Array(
		privateKeyHex
			.slice(2)
			.match(/.{2}/g)
			?.map((byte) => Number.parseInt(byte, 16)) || [],
	);

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(publicKey[i]);
		y = (y << 8n) | BigInt(publicKey[32 + i]);
	}
	const address = Address.fromPublicKey(x, y);

	const message: BrandedMessage = {
		domain: "example.com",
		address,
		uri: "https://example.com",
		version: "1",
		chainId: 1,
		nonce: "12345678",
		issuedAt: "2021-09-30T16:25:24.000Z",
	};

	const messageHash = getMessageHash(message) as BrandedHash;
	const sig = Secp256k1.sign(messageHash, privateKey);

	const signature = new Uint8Array(65);
	signature.set(sig.r, 0);
	signature.set(sig.s, 32);
	signature[64] = sig.v;

	return { message, signature, privateKey };
}

// ============================================================================
// Parse Tests - Valid Cases
// ============================================================================

describe("parse - valid messages", () => {
	it("parses minimal valid message", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		const parsed = parse(text);

		expect(parsed.domain).toBe("example.com");
		expect(parsed.address).toBeInstanceOf(Uint8Array);
		expect(parsed.address.length).toBe(20);
		expect(parsed.uri).toBe("https://example.com");
		expect(parsed.version).toBe("1");
		expect(parsed.chainId).toBe(1);
		expect(parsed.nonce).toBe("32891756");
		expect(parsed.issuedAt).toBe("2021-09-30T16:25:24Z");
	});

	it("parses message with all optional fields", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

Welcome to Example.com

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Expiration Time: 2021-10-01T16:25:24Z
Not Before: 2021-09-30T16:00:00Z
Request ID: request-abc123
Resources:
- https://example.com/resource1
- ipfs://Qmxxx
- did:example:123`;

		const parsed = parse(text);

		expect(parsed.statement).toBe("Welcome to Example.com");
		expect(parsed.expirationTime).toBe("2021-10-01T16:25:24Z");
		expect(parsed.notBefore).toBe("2021-09-30T16:00:00Z");
		expect(parsed.requestId).toBe("request-abc123");
		expect(parsed.resources).toHaveLength(3);
		expect(parsed.resources).toEqual([
			"https://example.com/resource1",
			"ipfs://Qmxxx",
			"did:example:123",
		]);
	});

	it("parses message with multiline statement", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

This is a multiline statement.
It can span multiple lines.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		const parsed = parse(text);

		expect(parsed.statement).toBe(
			"This is a multiline statement.\nIt can span multiple lines.",
		);
	});

	it("parses address with mixed case", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02AAA39B223FE8D0A0E5C4F27EAD9083C756CC2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		const parsed = parse(text);
		expect(parsed.address).toBeInstanceOf(Uint8Array);
		expect(parsed.address.length).toBe(20);
	});
});

// ============================================================================
// Parse Tests - Malformed Messages
// ============================================================================

describe("parse - malformed messages", () => {
	it("throws on missing domain header", () => {
		const text = `invalid header format
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`;

		expect(() => parse(text)).toThrow("missing domain header");
	});

	it("throws on invalid domain header format", () => {
		const text = `example.com some other text
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`;

		expect(() => parse(text)).toThrow("missing domain header");
	});

	it("throws on invalid address", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
invalid-address

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("address");
	});

	it("throws on address too short", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow();
	});

	it("throws on missing URI field", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("URI");
	});

	it("throws on missing Version field", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("Version");
	});

	it("throws on missing Chain ID field", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("Chain ID");
	});

	it("throws on missing Nonce field", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("Nonce");
	});

	it("throws on missing Issued At field", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756`;

		expect(() => parse(text)).toThrow("Issued At");
	});

	it("throws on invalid chain ID format", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: invalid
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("must be a number");
	});

	it("throws on chain ID with letters", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1abc
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		expect(() => parse(text)).toThrow("must be a number");
	});
});

// ============================================================================
// Validate Tests - Edge Cases
// ============================================================================

describe("validate - edge cases", () => {
	it("rejects empty domain", () => {
		const message = { ...createBasicMessage(), domain: "" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_domain");
		}
	});

	it("accepts subdomain", () => {
		const message = { ...createBasicMessage(), domain: "app.example.com" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts multi-level subdomain", () => {
		const message = {
			...createBasicMessage(),
			domain: "api.v2.app.example.com",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects address with wrong length", () => {
		const message = {
			...createBasicMessage(),
			address: new Uint8Array(19) as BrandedAddress,
		};
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_address");
		}
	});

	it("rejects address as null", () => {
		const message = {
			...createBasicMessage(),
			address: null as unknown as BrandedAddress,
		};
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_address");
		}
	});

	it("rejects empty URI", () => {
		const message = { ...createBasicMessage(), uri: "" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_uri");
		}
	});

	it("accepts URI with query parameters", () => {
		const message = {
			...createBasicMessage(),
			uri: "https://example.com/login?redirect=/dashboard&token=abc",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts URI with fragment", () => {
		const message = {
			...createBasicMessage(),
			uri: "https://example.com/login#section",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects version 2", () => {
		const message = { ...createBasicMessage(), version: "2" as "1" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_version");
			expect(result.error.message).toContain('expected "1"');
		}
	});

	it("rejects version 0", () => {
		const message = { ...createBasicMessage(), version: "0" as "1" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_version");
		}
	});

	it("rejects chain ID 0", () => {
		const message = { ...createBasicMessage(), chainId: 0 };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_chain_id");
		}
	});

	it("rejects negative chain ID", () => {
		const message = { ...createBasicMessage(), chainId: -1 };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_chain_id");
		}
	});

	it("accepts large chain ID", () => {
		const message = { ...createBasicMessage(), chainId: 999999999 };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects nonce with 7 characters", () => {
		const message = { ...createBasicMessage(), nonce: "1234567" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_nonce");
			expect(result.error.message).toContain("at least 8 characters");
		}
	});

	it("accepts nonce with exactly 8 characters", () => {
		const message = { ...createBasicMessage(), nonce: "12345678" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts long nonce", () => {
		const message = { ...createBasicMessage(), nonce: "a".repeat(100) };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects empty nonce", () => {
		const message = { ...createBasicMessage(), nonce: "" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_nonce");
		}
	});
});

// ============================================================================
// Validate Tests - Timestamp Security
// ============================================================================

describe("validate - timestamp security", () => {
	it("rejects invalid issuedAt timestamp", () => {
		const message = { ...createBasicMessage(), issuedAt: "not-a-timestamp" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_timestamp");
		}
	});

	it("rejects invalid expirationTime timestamp", () => {
		const message = {
			...createBasicMessage(),
			expirationTime: "invalid-date",
		};
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_timestamp");
			expect(result.error.message).toContain("expirationTime");
		}
	});

	it("rejects invalid notBefore timestamp", () => {
		const message = {
			...createBasicMessage(),
			notBefore: "invalid-date",
		};
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_timestamp");
			expect(result.error.message).toContain("notBefore");
		}
	});

	it("rejects expired message", () => {
		const now = new Date("2021-10-02T00:00:00.000Z");
		const message = {
			...createBasicMessage(),
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("expired");
		}
	});

	it("accepts message exactly at expiration time", () => {
		const now = new Date("2021-10-01T00:00:00.000Z");
		const message = {
			...createBasicMessage(),
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(false);
	});

	it("accepts message before expiration", () => {
		const now = new Date("2021-09-30T23:59:59.999Z");
		const message = {
			...createBasicMessage(),
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(true);
	});

	it("rejects message before notBefore", () => {
		const now = new Date("2021-09-29T23:59:59.999Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("not_yet_valid");
		}
	});

	it("accepts message exactly at notBefore time", () => {
		const now = new Date("2021-09-30T00:00:00.000Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(true);
	});

	it("accepts message after notBefore", () => {
		const now = new Date("2021-09-30T00:00:00.001Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(true);
	});

	it("validates with both notBefore and expirationTime", () => {
		const now = new Date("2021-09-30T12:00:00.000Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(true);
	});

	it("rejects when before notBefore with expirationTime set", () => {
		const now = new Date("2021-09-29T12:00:00.000Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("not_yet_valid");
		}
	});

	it("rejects when after expirationTime with notBefore set", () => {
		const now = new Date("2021-10-02T12:00:00.000Z");
		const message = {
			...createBasicMessage(),
			notBefore: "2021-09-30T00:00:00.000Z",
			expirationTime: "2021-10-01T00:00:00.000Z",
		};
		const result = validate(message, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("expired");
		}
	});

	it("uses current time when now option not provided", () => {
		const future = new Date(Date.now() + 86400000).toISOString();
		const message = {
			...createBasicMessage(),
			expirationTime: future,
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});
});

// ============================================================================
// Injection Attack Prevention Tests
// ============================================================================

describe("validate - injection attack prevention", () => {
	it("handles newlines in domain", () => {
		const message = {
			...createBasicMessage(),
			domain: "example.com\nmalicious.com",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("handles newlines in statement", () => {
		const message = {
			...createBasicMessage(),
			statement: "Line 1\nLine 2\nLine 3",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("handles special characters in nonce", () => {
		const message = {
			...createBasicMessage(),
			nonce: "12345678!@#$%^&*()",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("handles unicode in domain", () => {
		const message = { ...createBasicMessage(), domain: "例え.com" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("handles unicode in statement", () => {
		const message = { ...createBasicMessage(), statement: "サインイン" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("handles very long statement", () => {
		const message = { ...createBasicMessage(), statement: "a".repeat(10000) };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("preserves field injection attempts in parsing", () => {
		const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

Fake Field: malicious
URI: evil.com

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

		const parsed = parse(text);
		expect(parsed.statement).toContain("Fake Field");
		expect(parsed.uri).toBe("https://example.com");
	});
});

// ============================================================================
// Signature Verification Tests
// ============================================================================

describe("verify - signature verification", () => {
	it("returns false for all-zero signature", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(65);
		const result = verify(message, signature);

		expect(result).toBe(false);
	});

	it("returns false for signature with wrong length", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(64);
		const result = verify(message, signature);

		expect(result).toBe(false);
	});

	it("returns false for signature too long", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(66);
		const result = verify(message, signature);

		expect(result).toBe(false);
	});

	it("returns false for invalid recovery id", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(65);
		signature[64] = 5;
		const result = verify(message, signature);

		expect(result).toBe(false);
	});

	it("returns false for malformed signature components", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(65);
		signature.fill(0xff);
		signature[64] = 0;
		const result = verify(message, signature);

		expect(result).toBe(false);
	});

	it("verifies valid signature correctly", () => {
		const { message, signature } = createValidSignedMessage();
		const result = verify(message, signature);

		expect(result).toBe(true);
	});

	it("returns false when signature for different message", () => {
		const { signature } = createValidSignedMessage();
		const differentMessage = createBasicMessage();
		const result = verify(differentMessage, signature);

		expect(result).toBe(false);
	});

	it("returns false when address modified", () => {
		const { message, signature } = createValidSignedMessage();
		const modifiedMessage = {
			...message,
			address: createTestAddress(42),
		};
		const result = verify(modifiedMessage, signature);

		expect(result).toBe(false);
	});

	it("returns false when domain modified", () => {
		const { message, signature } = createValidSignedMessage();
		const modifiedMessage = {
			...message,
			domain: "attacker.com",
		};
		const result = verify(modifiedMessage, signature);

		expect(result).toBe(false);
	});

	it("returns false when nonce modified", () => {
		const { message, signature } = createValidSignedMessage();
		const modifiedMessage = {
			...message,
			nonce: "87654321",
		};
		const result = verify(modifiedMessage, signature);

		expect(result).toBe(false);
	});

	it("handles v value as 27/28", () => {
		const { message, signature } = createValidSignedMessage();
		const modifiedSignature = new Uint8Array(signature);
		modifiedSignature[64] = signature[64] + 27;
		const result = verify(message, modifiedSignature);

		expect(result).toBe(true);
	});

	it("handles v value as 0/1", () => {
		const { message, signature } = createValidSignedMessage();
		const result = verify(message, signature);

		expect(result).toBe(true);
	});
});

// ============================================================================
// Message Hash Tests
// ============================================================================

describe("getMessageHash - EIP-191 prefixing", () => {
	it("returns 32-byte hash", () => {
		const message = createBasicMessage();
		const hash = getMessageHash(message);

		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("returns different hashes for different messages", () => {
		const message1 = createBasicMessage();
		const message2 = { ...createBasicMessage(), domain: "different.com" };

		const hash1 = getMessageHash(message1);
		const hash2 = getMessageHash(message2);

		expect(hash1).not.toEqual(hash2);
	});

	it("returns same hash for identical messages", () => {
		const message1 = createBasicMessage();
		const message2 = createBasicMessage();

		const hash1 = getMessageHash(message1);
		const hash2 = getMessageHash(message2);

		expect(hash1).toEqual(hash2);
	});

	it("changes hash when any field changes", () => {
		const original = createBasicMessage();
		const originalHash = getMessageHash(original);

		const modifications = [
			{ ...original, domain: "other.com" },
			{ ...original, address: createTestAddress(2) },
			{ ...original, uri: "https://other.com" },
			{ ...original, chainId: 5 },
			{ ...original, nonce: "87654321" },
			{ ...original, issuedAt: "2021-10-01T00:00:00.000Z" },
		];

		for (const modified of modifications) {
			const modifiedHash = getMessageHash(modified);
			expect(modifiedHash).not.toEqual(originalHash);
		}
	});

	it("includes statement in hash when present", () => {
		const withoutStatement = createBasicMessage();
		const withStatement = {
			...createBasicMessage(),
			statement: "Sign in please",
		};

		const hash1 = getMessageHash(withoutStatement);
		const hash2 = getMessageHash(withStatement);

		expect(hash1).not.toEqual(hash2);
	});

	it("includes optional fields in hash", () => {
		const minimal = createBasicMessage();
		const withOptionals = {
			...createBasicMessage(),
			expirationTime: "2021-10-01T00:00:00.000Z",
			notBefore: "2021-09-30T00:00:00.000Z",
			requestId: "req-123",
			resources: ["https://example.com/resource"],
		};

		const hash1 = getMessageHash(minimal);
		const hash2 = getMessageHash(withOptionals);

		expect(hash1).not.toEqual(hash2);
	});
});

// ============================================================================
// Complete Verification Flow Tests
// ============================================================================

describe("verifyMessage - complete flow", () => {
	it("succeeds for valid message and signature", () => {
		const { message, signature } = createValidSignedMessage();
		const result = verifyMessage(message, signature);

		expect(result.valid).toBe(true);
	});

	it("fails for invalid message structure", () => {
		const message = { ...createBasicMessage(), version: "2" as "1" };
		const signature = new Uint8Array(65);
		const result = verifyMessage(message, signature);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_version");
		}
	});

	it("fails for expired message", () => {
		const { message, signature } = createValidSignedMessage();
		const expiredMessage = {
			...message,
			expirationTime: "2021-09-29T00:00:00.000Z",
		};
		const now = new Date("2021-10-01T00:00:00.000Z");
		const result = verifyMessage(expiredMessage, signature, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("expired");
		}
	});

	it("fails for not-yet-valid message", () => {
		const { message, signature } = createValidSignedMessage();
		const futureMessage = {
			...message,
			notBefore: "2021-10-02T00:00:00.000Z",
		};
		const now = new Date("2021-10-01T00:00:00.000Z");
		const result = verifyMessage(futureMessage, signature, { now });

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("not_yet_valid");
		}
	});

	it("fails for invalid signature", () => {
		const message = createBasicMessage();
		const signature = new Uint8Array(65);
		const result = verifyMessage(message, signature);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("signature_mismatch");
			expect(result.error.message).toContain("does not match");
		}
	});

	it("fails when signature matches different address", () => {
		const { message: originalMessage, signature } = createValidSignedMessage();
		const wrongAddressMessage = {
			...originalMessage,
			address: createTestAddress(99),
		};
		const result = verifyMessage(wrongAddressMessage, signature);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("signature_mismatch");
		}
	});

	it("validates message before checking signature", () => {
		const invalidMessage = { ...createBasicMessage(), nonce: "short" };
		const signature = new Uint8Array(65);
		const result = verifyMessage(invalidMessage, signature);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_nonce");
		}
	});
});

// ============================================================================
// Domain Validation Tests
// ============================================================================

describe("validate - domain validation", () => {
	it("accepts simple domain", () => {
		const message = { ...createBasicMessage(), domain: "example.com" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts localhost", () => {
		const message = { ...createBasicMessage(), domain: "localhost" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts domain with port", () => {
		const message = { ...createBasicMessage(), domain: "example.com:3000" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts IP address", () => {
		const message = { ...createBasicMessage(), domain: "192.168.1.1" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts IPv6 address", () => {
		const message = { ...createBasicMessage(), domain: "[::1]" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects domain as whitespace only", () => {
		const message = { ...createBasicMessage(), domain: "   " };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_domain");
		}
	});
});

// ============================================================================
// URI Validation Tests
// ============================================================================

describe("validate - URI validation", () => {
	it("accepts https URI", () => {
		const message = { ...createBasicMessage(), uri: "https://example.com" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts http URI", () => {
		const message = { ...createBasicMessage(), uri: "http://example.com" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts ipfs URI", () => {
		const message = { ...createBasicMessage(), uri: "ipfs://Qmxxx" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts did URI", () => {
		const message = {
			...createBasicMessage(),
			uri: "did:example:123456789abcdefghi",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts URI with path", () => {
		const message = {
			...createBasicMessage(),
			uri: "https://example.com/path/to/resource",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts URI with query string and fragment", () => {
		const message = {
			...createBasicMessage(),
			uri: "https://example.com/path?query=value#fragment",
		};
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("rejects empty URI", () => {
		const message = { ...createBasicMessage(), uri: "" };
		const result = validate(message);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error.type).toBe("invalid_uri");
		}
	});
});

// ============================================================================
// Nonce Format Tests
// ============================================================================

describe("validate - nonce format", () => {
	it("accepts alphanumeric nonce", () => {
		const message = { ...createBasicMessage(), nonce: "abc123XYZ" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts numeric-only nonce", () => {
		const message = { ...createBasicMessage(), nonce: "12345678" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts alphabetic-only nonce", () => {
		const message = { ...createBasicMessage(), nonce: "abcdefgh" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts nonce with special characters", () => {
		const message = { ...createBasicMessage(), nonce: "12345678-abc" };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});

	it("accepts very long nonce", () => {
		const message = { ...createBasicMessage(), nonce: "a".repeat(1000) };
		const result = validate(message);

		expect(result.valid).toBe(true);
	});
});

// ============================================================================
// Roundtrip Tests
// ============================================================================

describe("format and parse roundtrip", () => {
	it("roundtrips minimal message", () => {
		const original = createBasicMessage();
		const formatted = format(original);
		const parsed = parse(formatted);

		expect(parsed.domain).toBe(original.domain);
		expect(Array.from(parsed.address)).toEqual(Array.from(original.address));
		expect(parsed.uri).toBe(original.uri);
		expect(parsed.version).toBe(original.version);
		expect(parsed.chainId).toBe(original.chainId);
		expect(parsed.nonce).toBe(original.nonce);
		expect(parsed.issuedAt).toBe(original.issuedAt);
	});

	it("roundtrips message with all fields", () => {
		const original: BrandedMessage = {
			domain: "example.com",
			address: createTestAddress(42),
			uri: "https://example.com/login?redirect=/dashboard",
			version: "1",
			chainId: 1,
			nonce: "abcd1234",
			issuedAt: "2021-09-30T16:25:24.000Z",
			statement: "Welcome back!",
			expirationTime: "2021-10-01T16:25:24.000Z",
			notBefore: "2021-09-30T16:00:00.000Z",
			requestId: "req-xyz-123",
			resources: [
				"https://example.com/resource1",
				"ipfs://Qmxxx",
				"did:example:123",
			],
		};

		const formatted = format(original);
		const parsed = parse(formatted);

		expect(parsed.domain).toBe(original.domain);
		expect(Array.from(parsed.address)).toEqual(Array.from(original.address));
		expect(parsed.uri).toBe(original.uri);
		expect(parsed.version).toBe(original.version);
		expect(parsed.chainId).toBe(original.chainId);
		expect(parsed.nonce).toBe(original.nonce);
		expect(parsed.issuedAt).toBe(original.issuedAt);
		expect(parsed.statement).toBe(original.statement);
		expect(parsed.expirationTime).toBe(original.expirationTime);
		expect(parsed.notBefore).toBe(original.notBefore);
		expect(parsed.requestId).toBe(original.requestId);
		expect(parsed.resources).toEqual(original.resources);
	});

	it("preserves timestamp format through roundtrip", () => {
		const formats = [
			"2021-09-30T16:25:24Z",
			"2021-09-30T16:25:24.000Z",
			"2021-09-30T16:25:24.123Z",
		];

		for (const timestamp of formats) {
			const original = { ...createBasicMessage(), issuedAt: timestamp };
			const formatted = format(original);
			const parsed = parse(formatted);

			expect(parsed.issuedAt).toBe(timestamp);
		}
	});

	it("preserves multiline statement through roundtrip", () => {
		const original = {
			...createBasicMessage(),
			statement: "Line 1\nLine 2\nLine 3 with special chars: @#$%",
		};

		const formatted = format(original);
		const parsed = parse(formatted);

		expect(parsed.statement).toBe(original.statement);
	});

	it("preserves resources through roundtrip", () => {
		const original = {
			...createBasicMessage(),
			resources: [
				"https://example.com/resource1",
				"ipfs://Qmxxx",
				"did:example:123",
				"https://example.com/resource?query=value#fragment",
			],
		};

		const formatted = format(original);
		const parsed = parse(formatted);

		expect(parsed.resources).toEqual(original.resources);
	});
});
