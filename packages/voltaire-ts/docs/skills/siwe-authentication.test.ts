/**
 * Tests for SIWE authentication guide
 * @see /docs/guides/siwe-authentication.mdx
 */
import { describe, expect, it } from "vitest";

describe("SIWE Authentication Guide", () => {
	it("should create SIWE messages with required fields", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
		});

		expect(message.domain).toBe("myapp.com");
		expect(message.uri).toBe("https://myapp.com/login");
		expect(message.chainId).toBe(1);
		expect(message.version).toBe("1");
		expect(message.nonce).toBeDefined();
		expect(message.issuedAt).toBeDefined();
	});

	it("should create SIWE messages with optional fields", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
			statement: "Sign in to access your dashboard",
			expirationTime: new Date(Date.now() + 3600000).toISOString(),
			notBefore: new Date().toISOString(),
			requestId: "unique-request-123",
			resources: [
				"https://myapp.com/api/profile",
				"https://myapp.com/api/settings",
			],
		});

		expect(message.statement).toBe("Sign in to access your dashboard");
		expect(message.requestId).toBe("unique-request-123");
		expect(message.resources).toHaveLength(2);
	});

	it("should generate and use custom nonces", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const serverNonce = Siwe.generateNonce();
		expect(serverNonce.length).toBeGreaterThanOrEqual(8);

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
			nonce: serverNonce,
		});

		expect(message.nonce).toBe(serverNonce);
	});

	it("should format messages to EIP-4361 text", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
			statement: "Sign in to access your dashboard",
		});

		const messageText = Siwe.format(message);

		// Should be a valid string with domain and core fields
		expect(typeof messageText).toBe("string");
		expect(messageText.length).toBeGreaterThan(0);
		// Check for core elements (address in lowercase is OK)
		expect(messageText.toLowerCase()).toContain("myapp.com");
	});

	it("should validate message structure", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
		});

		const validation = Siwe.validate(message);
		expect(validation.valid).toBe(true);
	});

	it("should validate expired messages", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		// Create message with past expiration
		const pastTime = new Date(Date.now() - 3600000).toISOString();
		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
			expirationTime: pastTime,
		});

		const validation = Siwe.validate(message);
		expect(validation.valid).toBe(false);
		if (!validation.valid) {
			expect(validation.error.type).toBe("expired");
		}
	});

	it("should parse formatted messages back to objects", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const original = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
			statement: "Sign in to access your account",
		});

		const messageText = Siwe.format(original);
		const parsed = Siwe.parse(messageText);

		expect(parsed.domain).toBe(original.domain);
		expect(parsed.uri).toBe(original.uri);
		expect(parsed.chainId).toBe(original.chainId);
		expect(parsed.statement).toBe(original.statement);
	});

	it("should get message hash for signing", async () => {
		const { Siwe } = await import("../../src/primitives/Siwe/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

		const message = Siwe.create({
			domain: "myapp.com",
			address: userAddress,
			uri: "https://myapp.com/login",
			chainId: 1,
		});

		const hash = Siwe.getMessageHash(message);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});
