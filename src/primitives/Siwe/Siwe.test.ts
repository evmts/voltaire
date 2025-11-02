/**
 * Tests for SIWE (Sign-In with Ethereum) module
 */

import { describe, it, expect } from "vitest";
import * as Siwe from "./Siwe.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Test Utilities
// ============================================================================

function createTestAddress(seed: number): Address {
  const addr = new Uint8Array(20);
  addr.fill(seed);
  return addr as Address;
}

function createBasicMessage(): Siwe.Message {
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

// ============================================================================
// Message Creation Tests
// ============================================================================

describe("Siwe.create", () => {
  it("creates message with required fields", () => {
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
    });

    expect(message.domain).toBe("example.com");
    expect(message.address).toBeInstanceOf(Uint8Array);
    expect(message.address.length).toBe(20);
    expect(message.uri).toBe("https://example.com");
    expect(message.version).toBe("1");
    expect(message.chainId).toBe(1);
    expect(message.nonce).toBeTruthy();
    expect(message.nonce.length).toBeGreaterThanOrEqual(8);
    expect(message.issuedAt).toBeTruthy();
  });

  it("creates message with optional fields", () => {
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
      statement: "Sign in to Example",
      expirationTime: "2021-10-01T16:25:24.000Z",
      notBefore: "2021-09-30T16:00:00.000Z",
      requestId: "request-123",
      resources: ["https://example.com/resource1", "https://example.com/resource2"],
    });

    expect(message.statement).toBe("Sign in to Example");
    expect(message.expirationTime).toBe("2021-10-01T16:25:24.000Z");
    expect(message.notBefore).toBe("2021-09-30T16:00:00.000Z");
    expect(message.requestId).toBe("request-123");
    expect(message.resources).toHaveLength(2);
  });

  it("allows custom nonce", () => {
    const customNonce = "customnonce123";
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
      nonce: customNonce,
    });

    expect(message.nonce).toBe(customNonce);
  });

  it("allows custom issuedAt", () => {
    const customTime = "2020-01-01T00:00:00.000Z";
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
      issuedAt: customTime,
    });

    expect(message.issuedAt).toBe(customTime);
  });
});

// ============================================================================
// Nonce Generation Tests
// ============================================================================

describe("Siwe.generateNonce", () => {
  it("generates nonce with default length", () => {
    const nonce = Siwe.generateNonce();
    expect(nonce.length).toBe(11);
    expect(/^[0-9A-Za-z]+$/.test(nonce)).toBe(true);
  });

  it("generates nonce with custom length", () => {
    const nonce = Siwe.generateNonce(16);
    expect(nonce.length).toBe(16);
    expect(/^[0-9A-Za-z]+$/.test(nonce)).toBe(true);
  });

  it("throws error for nonce length less than 8", () => {
    expect(() => Siwe.generateNonce(7)).toThrow(
      "Nonce length must be at least 8 characters",
    );
  });

  it("generates unique nonces", () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(Siwe.generateNonce());
    }
    // With 100 random 11-character base62 strings, collisions are astronomically unlikely
    expect(nonces.size).toBe(100);
  });

  it("accepts minimum length of 8", () => {
    const nonce = Siwe.generateNonce(8);
    expect(nonce.length).toBe(8);
    expect(/^[0-9A-Za-z]+$/.test(nonce)).toBe(true);
  });
});

// ============================================================================
// Message Formatting Tests
// ============================================================================

describe("Siwe.Message.format", () => {
  it("formats basic message correctly", () => {
    const message = createBasicMessage();
    const formatted = Siwe.Message.format(message);

    expect(formatted).toContain("example.com wants you to sign in with your Ethereum account:");
    expect(formatted).toContain("0x0101010101010101010101010101010101010101");
    expect(formatted).toContain("URI: https://example.com/login");
    expect(formatted).toContain("Version: 1");
    expect(formatted).toContain("Chain ID: 1");
    expect(formatted).toContain("Nonce: 12345678");
    expect(formatted).toContain("Issued At: 2021-09-30T16:25:24.000Z");
  });

  it("formats message with statement", () => {
    const message = {
      ...createBasicMessage(),
      statement: "Sign in to access your account",
    };
    const formatted = Siwe.Message.format(message);

    expect(formatted).toContain("Sign in to access your account");
  });

  it("formats message with optional fields", () => {
    const message = {
      ...createBasicMessage(),
      expirationTime: "2021-10-01T16:25:24.000Z",
      notBefore: "2021-09-30T16:00:00.000Z",
      requestId: "request-123",
    };
    const formatted = Siwe.Message.format(message);

    expect(formatted).toContain("Expiration Time: 2021-10-01T16:25:24.000Z");
    expect(formatted).toContain("Not Before: 2021-09-30T16:00:00.000Z");
    expect(formatted).toContain("Request ID: request-123");
  });

  it("formats message with resources", () => {
    const message = {
      ...createBasicMessage(),
      resources: ["https://example.com/resource1", "https://example.com/resource2"],
    };
    const formatted = Siwe.Message.format(message);

    expect(formatted).toContain("Resources:");
    expect(formatted).toContain("- https://example.com/resource1");
    expect(formatted).toContain("- https://example.com/resource2");
  });

  it("formats message with all fields", () => {
    const message = {
      ...createBasicMessage(),
      statement: "Welcome to Example",
      expirationTime: "2021-10-01T16:25:24.000Z",
      notBefore: "2021-09-30T16:00:00.000Z",
      requestId: "request-123",
      resources: ["https://example.com/resource1"],
    };
    const formatted = Siwe.Message.format(message);

    expect(formatted).toContain("example.com wants you to sign in");
    expect(formatted).toContain("Welcome to Example");
    expect(formatted).toContain("URI:");
    expect(formatted).toContain("Version:");
    expect(formatted).toContain("Chain ID:");
    expect(formatted).toContain("Nonce:");
    expect(formatted).toContain("Issued At:");
    expect(formatted).toContain("Expiration Time:");
    expect(formatted).toContain("Not Before:");
    expect(formatted).toContain("Request ID:");
    expect(formatted).toContain("Resources:");
  });
});

describe("Siwe.format", () => {
  it("formats message using public wrapper", () => {
    const message = createBasicMessage();
    const formatted = Siwe.format(message);

    expect(formatted).toContain("example.com wants you to sign in");
    expect(formatted).toContain("0x0101010101010101010101010101010101010101");
  });
});

// ============================================================================
// Message Parsing Tests
// ============================================================================

describe("Siwe.parse", () => {
  it("parses basic message", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

    const parsed = Siwe.parse(text);

    expect(parsed.domain).toBe("example.com");
    expect(parsed.address).toBeInstanceOf(Uint8Array);
    expect(parsed.address.length).toBe(20);
    expect(parsed.uri).toBe("https://example.com");
    expect(parsed.version).toBe("1");
    expect(parsed.chainId).toBe(1);
    expect(parsed.nonce).toBe("32891756");
    expect(parsed.issuedAt).toBe("2021-09-30T16:25:24Z");
    expect(parsed.statement).toBeUndefined();
  });

  it("parses message with statement", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

Sign in to Example

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

    const parsed = Siwe.parse(text);
    expect(parsed.statement).toBe("Sign in to Example");
  });

  it("parses message with multiline statement", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

This is a multi-line
statement for signing in

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

    const parsed = Siwe.parse(text);
    expect(parsed.statement).toBe("This is a multi-line\nstatement for signing in");
  });

  it("parses message with optional fields", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Expiration Time: 2021-10-01T16:25:24Z
Not Before: 2021-09-30T16:00:00Z
Request ID: request-123`;

    const parsed = Siwe.parse(text);
    expect(parsed.expirationTime).toBe("2021-10-01T16:25:24Z");
    expect(parsed.notBefore).toBe("2021-09-30T16:00:00Z");
    expect(parsed.requestId).toBe("request-123");
  });

  it("parses message with resources", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Resources:
- https://example.com/resource1
- https://example.com/resource2`;

    const parsed = Siwe.parse(text);
    expect(parsed.resources).toHaveLength(2);
    expect(parsed.resources?.[0]).toBe("https://example.com/resource1");
    expect(parsed.resources?.[1]).toBe("https://example.com/resource2");
  });

  it("throws on invalid domain header", () => {
    const text = `invalid header
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`;

    expect(() => Siwe.parse(text)).toThrow("Invalid SIWE message: missing domain header");
  });

  it("throws on invalid address", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
invalid-address`;

    expect(() => Siwe.parse(text)).toThrow("Invalid SIWE message: missing or invalid address");
  });

  it("throws on missing required fields", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com`;

    expect(() => Siwe.parse(text)).toThrow("Invalid SIWE message: missing required fields");
  });

  it("throws on invalid chain ID", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com
Version: 1
Chain ID: invalid
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

    expect(() => Siwe.parse(text)).toThrow("Invalid SIWE message: Chain ID must be a number");
  });

  it("roundtrips format and parse", () => {
    const original = {
      domain: "example.com",
      address: createTestAddress(42),
      uri: "https://example.com",
      version: "1" as const,
      chainId: 1,
      nonce: "testnonce",
      issuedAt: "2021-09-30T16:25:24.000Z",
      statement: "Sign in test",
      resources: ["https://example.com/resource1"],
    };

    const formatted = Siwe.Message.format(original);
    const parsed = Siwe.parse(formatted);

    expect(parsed.domain).toBe(original.domain);
    expect(Array.from(parsed.address)).toEqual(Array.from(original.address));
    expect(parsed.uri).toBe(original.uri);
    expect(parsed.version).toBe(original.version);
    expect(parsed.chainId).toBe(original.chainId);
    expect(parsed.nonce).toBe(original.nonce);
    expect(parsed.issuedAt).toBe(original.issuedAt);
    expect(parsed.statement).toBe(original.statement);
    expect(parsed.resources).toEqual(original.resources);
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("Siwe.Message.validate", () => {
  it("validates correct message", () => {
    const message = createBasicMessage();
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(true);
  });

  it("rejects empty domain", () => {
    const message = { ...createBasicMessage(), domain: "" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_domain");
      expect(result.error.message).toContain("Domain is required");
    }
  });

  it("rejects invalid address", () => {
    const message = { ...createBasicMessage(), address: new Uint8Array(10) as Address };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_address");
    }
  });

  it("rejects missing URI", () => {
    const message = { ...createBasicMessage(), uri: "" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_uri");
    }
  });

  it("rejects invalid version", () => {
    const message = { ...createBasicMessage(), version: "2" as "1" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_version");
      expect(result.error.message).toContain('expected "1"');
    }
  });

  it("rejects invalid chain ID", () => {
    const message = { ...createBasicMessage(), chainId: 0 };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_chain_id");
    }
  });

  it("rejects negative chain ID", () => {
    const message = { ...createBasicMessage(), chainId: -1 };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_chain_id");
    }
  });

  it("rejects short nonce", () => {
    const message = { ...createBasicMessage(), nonce: "1234567" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_nonce");
      expect(result.error.message).toContain("at least 8 characters");
    }
  });

  it("accepts nonce with exactly 8 characters", () => {
    const message = { ...createBasicMessage(), nonce: "12345678" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(true);
  });

  it("rejects invalid issuedAt timestamp", () => {
    const message = { ...createBasicMessage(), issuedAt: "invalid-timestamp" };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_timestamp");
    }
  });

  it("rejects expired message", () => {
    const now = new Date("2021-10-02T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      expirationTime: "2021-10-01T00:00:00.000Z",
    };
    const result = Siwe.Message.validate(message, { now });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("expired");
    }
  });

  it("accepts message before expiration", () => {
    const now = new Date("2021-09-30T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      expirationTime: "2021-10-01T00:00:00.000Z",
    };
    const result = Siwe.Message.validate(message, { now });

    expect(result.valid).toBe(true);
  });

  it("rejects message before notBefore", () => {
    const now = new Date("2021-09-29T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      notBefore: "2021-09-30T00:00:00.000Z",
    };
    const result = Siwe.Message.validate(message, { now });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("not_yet_valid");
    }
  });

  it("accepts message after notBefore", () => {
    const now = new Date("2021-10-01T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      notBefore: "2021-09-30T00:00:00.000Z",
    };
    const result = Siwe.Message.validate(message, { now });

    expect(result.valid).toBe(true);
  });

  it("rejects invalid expirationTime timestamp", () => {
    const message = {
      ...createBasicMessage(),
      expirationTime: "invalid-timestamp",
    };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_timestamp");
      expect(result.error.message).toContain("expirationTime");
    }
  });

  it("rejects invalid notBefore timestamp", () => {
    const message = {
      ...createBasicMessage(),
      notBefore: "invalid-timestamp",
    };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_timestamp");
      expect(result.error.message).toContain("notBefore");
    }
  });

  it("uses current time when now option not provided", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const message = {
      ...createBasicMessage(),
      expirationTime: future,
    };
    const result = Siwe.Message.validate(message);

    expect(result.valid).toBe(true);
  });
});

describe("Siwe.validate", () => {
  it("validates message using public wrapper", () => {
    const message = createBasicMessage();
    const result = Siwe.validate(message);

    expect(result.valid).toBe(true);
  });

  it("accepts custom now option", () => {
    const now = new Date("2021-09-29T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      notBefore: "2021-09-30T00:00:00.000Z",
    };
    const result = Siwe.validate(message, { now });

    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Signature Tests (Not Implemented)
// ============================================================================

describe("Siwe.Message.getMessageHash", () => {
  it("returns message hash", () => {
    const message = createBasicMessage();
    const hash = Siwe.Message.getMessageHash(message);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

describe("Siwe.Message.verify", () => {
  it("returns false for invalid signature", () => {
    const message = createBasicMessage();
    const signature = new Uint8Array(65);
    const result = Siwe.Message.verify(message, signature);
    expect(result).toBe(false);
  });
});

describe("Siwe.getMessageHash", () => {
  it("returns message hash using public wrapper", () => {
    const message = createBasicMessage();
    const hash = Siwe.getMessageHash(message);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

describe("Siwe.verify", () => {
  it("returns false for invalid signature using public wrapper", () => {
    const message = createBasicMessage();
    const signature = new Uint8Array(65);
    const result = Siwe.verify(message, signature);
    expect(result).toBe(false);
  });
});

// ============================================================================
// verifyMessage Tests
// ============================================================================

describe("Siwe.verifyMessage", () => {
  it("fails validation for invalid message", () => {
    const message = { ...createBasicMessage(), version: "2" as "1" };
    const signature = new Uint8Array(65);
    const result = Siwe.verifyMessage(message, signature);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("invalid_version");
    }
  });

  it("fails for expired message", () => {
    const now = new Date("2021-10-02T00:00:00.000Z");
    const message = {
      ...createBasicMessage(),
      expirationTime: "2021-10-01T00:00:00.000Z",
    };
    const signature = new Uint8Array(65);
    const result = Siwe.verifyMessage(message, signature, { now });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("expired");
    }
  });

  it("returns false for invalid signature", () => {
    const message = createBasicMessage();
    const signature = new Uint8Array(65);
    const result = Siwe.verifyMessage(message, signature);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.type).toBe("signature_mismatch");
      expect(result.error.message).toContain("does not match message address");
    }
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("SIWE Edge Cases", () => {
  it("handles address with all zeros", () => {
    const message = {
      ...createBasicMessage(),
      address: new Uint8Array(20) as Address,
    };
    const formatted = Siwe.Message.format(message);
    expect(formatted).toContain("0x0000000000000000000000000000000000000000");
  });

  it("handles address with all 0xff", () => {
    const addr = new Uint8Array(20).fill(0xff) as Address;
    const message = {
      ...createBasicMessage(),
      address: addr,
    };
    const formatted = Siwe.Message.format(message);
    expect(formatted).toContain("0xffffffffffffffffffffffffffffffffffffffff");
  });

  it("handles very long statement", () => {
    const longStatement = "a".repeat(1000);
    const message = {
      ...createBasicMessage(),
      statement: longStatement,
    };
    const formatted = Siwe.Message.format(message);
    expect(formatted).toContain(longStatement);
  });

  it("handles empty resources array", () => {
    const message = {
      ...createBasicMessage(),
      resources: [],
    };
    const formatted = Siwe.Message.format(message);
    expect(formatted).not.toContain("Resources:");
  });

  it("handles special characters in domain", () => {
    const message = {
      ...createBasicMessage(),
      domain: "sub.example.com",
    };
    const result = Siwe.Message.validate(message);
    expect(result.valid).toBe(true);
  });

  it("handles various chain IDs", () => {
    const chainIds = [1, 5, 137, 42161, 10, 100, 1337];
    for (const chainId of chainIds) {
      const message = { ...createBasicMessage(), chainId };
      const result = Siwe.Message.validate(message);
      expect(result.valid).toBe(true);
    }
  });

  it("parses addresses with uppercase hex", () => {
    const text = `example.com wants you to sign in with your Ethereum account:
0xC02AAA39B223FE8D0A0E5C4F27EAD9083C756CC2

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`;

    const parsed = Siwe.parse(text);
    expect(parsed.address).toBeInstanceOf(Uint8Array);
    expect(parsed.address.length).toBe(20);
  });

  it("handles ISO 8601 timestamps with various formats", () => {
    const formats = [
      "2021-09-30T16:25:24Z",
      "2021-09-30T16:25:24.000Z",
      "2021-09-30T16:25:24+00:00",
      "2021-09-30T16:25:24.123Z",
    ];

    for (const format of formats) {
      const message = { ...createBasicMessage(), issuedAt: format };
      const result = Siwe.Message.validate(message);
      expect(result.valid).toBe(true);
    }
  });

  it("handles URI with query parameters", () => {
    const message = {
      ...createBasicMessage(),
      uri: "https://example.com/login?redirect=/dashboard&source=mobile",
    };
    const result = Siwe.Message.validate(message);
    expect(result.valid).toBe(true);

    const formatted = Siwe.Message.format(message);
    const parsed = Siwe.parse(formatted);
    expect(parsed.uri).toBe(message.uri);
  });

  it("handles URI with fragment", () => {
    const message = {
      ...createBasicMessage(),
      uri: "https://example.com/login#section",
    };
    const formatted = Siwe.Message.format(message);
    const parsed = Siwe.parse(formatted);
    expect(parsed.uri).toBe(message.uri);
  });

  it("handles multiple resources with special characters", () => {
    const message = {
      ...createBasicMessage(),
      resources: [
        "https://example.com/resource?id=123",
        "ipfs://QmXxx",
        "did:example:123456789abcdefghi",
      ],
    };
    const formatted = Siwe.Message.format(message);
    const parsed = Siwe.parse(formatted);
    expect(parsed.resources).toEqual(message.resources);
  });

  it("preserves exact timestamp strings through roundtrip", () => {
    const timestamp = "2021-09-30T16:25:24.123456Z";
    const message = {
      ...createBasicMessage(),
      issuedAt: timestamp,
    };
    const formatted = Siwe.Message.format(message);
    const parsed = Siwe.parse(formatted);
    expect(parsed.issuedAt).toBe(timestamp);
  });
});

// ============================================================================
// Type Tests
// ============================================================================

describe("SIWE Type Safety", () => {
  it("enforces Address type for address field", () => {
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
    });

    expect(message.address).toBeInstanceOf(Uint8Array);
    expect(message.address.length).toBe(20);
  });

  it("enforces version is '1'", () => {
    const message = Siwe.create({
      domain: "example.com",
      address: createTestAddress(1),
      uri: "https://example.com",
      chainId: 1,
    });

    expect(message.version).toBe("1");
  });

  it("signature type is Uint8Array", () => {
    const signature: Siwe.Signature = new Uint8Array(65);
    expect(signature).toBeInstanceOf(Uint8Array);
  });

  it("validation result has correct structure", () => {
    const message = createBasicMessage();
    const result = Siwe.Message.validate(message);

    if (result.valid) {
      expect(result.valid).toBe(true);
    } else {
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBeTruthy();
      expect(result.error.message).toBeTruthy();
    }
  });
});
