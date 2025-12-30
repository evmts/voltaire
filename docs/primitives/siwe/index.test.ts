/**
 * Tests for docs/primitives/siwe/index.mdx
 *
 * Validates that all code examples in the SIWE documentation work correctly.
 * SIWE (Sign-In with Ethereum) provides EIP-4361 message creation and verification.
 */
import { describe, expect, it } from "vitest";

describe("SIWE Documentation - index.mdx", () => {
	describe("Message Creation", () => {
		it("should create SIWE message with create()", async () => {
			const { create } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				statement: "Sign in to Example App",
			});

			expect(message).toBeDefined();
			expect(message.domain).toBe("example.com");
			expect(message.uri).toBe("https://example.com/login");
			expect(message.chainId).toBe(1);
			expect(message.statement).toBe("Sign in to Example App");
		});

		it("should create SIWE message with Siwe() constructor", async () => {
			const { Siwe } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = Siwe({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			expect(message).toBeDefined();
			expect(message.domain).toBe("example.com");
		});
	});

	describe("Message Formatting", () => {
		it("should format message to EIP-4361 string with format()", async () => {
			const { create, format } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				statement: "Sign in to Example App",
			});

			const formatted = format(message);

			expect(typeof formatted).toBe("string");
			expect(formatted).toContain("example.com");
			expect(formatted).toContain("wants you to sign in");
			expect(formatted).toContain("Sign in to Example App");
		});
	});

	describe("Message Parsing", () => {
		it("should parse EIP-4361 message string with parse()", async () => {
			const { create, format, parse } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const original = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				statement: "Sign in to Example App",
			});

			const formatted = format(original);
			const parsed = parse(formatted);

			expect(parsed.domain).toBe(original.domain);
			expect(parsed.uri).toBe(original.uri);
			expect(parsed.chainId).toBe(original.chainId);
			expect(parsed.statement).toBe(original.statement);
		});
	});

	describe("Nonce Generation", () => {
		it("should generate random nonce with generateNonce()", async () => {
			const { generateNonce } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			const nonce1 = generateNonce();
			const nonce2 = generateNonce();

			expect(typeof nonce1).toBe("string");
			expect(nonce1.length).toBeGreaterThan(0);
			// Nonces should be different (random)
			expect(nonce1).not.toBe(nonce2);
		});

		it("should generate nonce with custom length", async () => {
			const { generateNonce } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			const nonce = generateNonce(32);
			expect(nonce.length).toBe(32);
		});
	});

	describe("Message Hash", () => {
		it("should compute message hash with getMessageHash()", async () => {
			const { create, getMessageHash } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			const hash = getMessageHash(message);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});
	});

	describe("Validation", () => {
		it("should validate message with validate()", async () => {
			const { create, validate } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			const result = validate(message);

			expect(result).toBeDefined();
			expect(typeof result.valid).toBe("boolean");
		});

		it("should validate message with custom now time", async () => {
			const { create, validate } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			const result = validate(message, { now: new Date() });

			expect(result).toBeDefined();
		});
	});

	describe("Optional Message Fields", () => {
		it("should support expirationTime", async () => {
			const { create, format } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const expiration = new Date(
				Date.now() + 1000 * 60 * 60,
			).toISOString();

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				expirationTime: expiration,
			});

			expect(message.expirationTime).toBe(expiration);
			const formatted = format(message);
			expect(formatted).toContain("Expiration Time:");
		});

		it("should support notBefore", async () => {
			const { create, format } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const notBefore = new Date(Date.now() - 1000 * 60).toISOString();

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				notBefore,
			});

			expect(message.notBefore).toBe(notBefore);
			const formatted = format(message);
			expect(formatted).toContain("Not Before:");
		});

		it("should support requestId", async () => {
			const { create, format } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				requestId: "abc123",
			});

			expect(message.requestId).toBe("abc123");
			const formatted = format(message);
			expect(formatted).toContain("Request ID: abc123");
		});

		it("should support resources array", async () => {
			const { create, format } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
				resources: [
					"https://example.com/resource1",
					"https://example.com/resource2",
				],
			});

			expect(message.resources).toHaveLength(2);
			const formatted = format(message);
			expect(formatted).toContain("Resources:");
		});
	});

	describe("BrandedSiwe Namespace", () => {
		it("should export BrandedSiwe namespace with all methods", async () => {
			const { BrandedSiwe } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			expect(BrandedSiwe).toBeDefined();
			expect(typeof BrandedSiwe.create).toBe("function");
			expect(typeof BrandedSiwe.format).toBe("function");
			expect(typeof BrandedSiwe.generateNonce).toBe("function");
			expect(typeof BrandedSiwe.getMessageHash).toBe("function");
			expect(typeof BrandedSiwe.parse).toBe("function");
			expect(typeof BrandedSiwe.validate).toBe("function");
			expect(typeof BrandedSiwe.verify).toBe("function");
			expect(typeof BrandedSiwe.verifyMessage).toBe("function");
		});
	});

	describe("Siwe Static Methods", () => {
		it("should have Siwe.create() static method", async () => {
			const { Siwe } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const message = Siwe.create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			expect(message.domain).toBe("example.com");
		});

		it("should have Siwe.parse() static method", async () => {
			const { Siwe } = await import(
				"../../../src/primitives/Siwe/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			const original = Siwe.create({
				domain: "example.com",
				address: addr,
				uri: "https://example.com/login",
				chainId: 1,
			});

			const formatted = Siwe.format(original);
			const parsed = Siwe.parse(formatted);

			expect(parsed.domain).toBe("example.com");
		});
	});

	describe("Error Types", () => {
		it("should export error types", async () => {
			const {
				InvalidSiweMessageError,
				MissingFieldError,
				InvalidFieldError,
				InvalidNonceLengthError,
				SiweParseError,
			} = await import("../../../src/primitives/Siwe/index.js");

			expect(InvalidSiweMessageError).toBeDefined();
			expect(MissingFieldError).toBeDefined();
			expect(InvalidFieldError).toBeDefined();
			expect(InvalidNonceLengthError).toBeDefined();
			expect(SiweParseError).toBeDefined();
		});
	});

	describe("Factory Functions", () => {
		it("should export GetMessageHash factory", async () => {
			const { GetMessageHash } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			expect(typeof GetMessageHash).toBe("function");
		});

		it("should export Verify factory", async () => {
			const { Verify } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			expect(typeof Verify).toBe("function");
		});

		it("should export VerifyMessage factory", async () => {
			const { VerifyMessage } = await import(
				"../../../src/primitives/Siwe/index.js"
			);

			expect(typeof VerifyMessage).toBe("function");
		});
	});
});
