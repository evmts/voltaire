/**
 * Tests for Siwe Module - Ox-based Implementation
 */

import { describe, expect, it } from "vitest";
import * as Siwe from "./index.ox.js";

// ============================================================================
// Export Coverage Tests
// ============================================================================

describe("Siwe module exports", () => {
	it("exports all 13 Ox functions and types", () => {
		// Core functions
		expect(typeof Siwe.createMessage).toBe("function");
		expect(typeof Siwe.parseMessage).toBe("function");
		expect(typeof Siwe.validateMessage).toBe("function");
		expect(typeof Siwe.generateNonce).toBe("function");
		expect(typeof Siwe.isUri).toBe("function");

		// Regex patterns
		expect(Siwe.domainRegex instanceof RegExp).toBe(true);
		expect(Siwe.ipRegex instanceof RegExp).toBe(true);
		expect(Siwe.localhostRegex instanceof RegExp).toBe(true);
		expect(Siwe.nonceRegex instanceof RegExp).toBe(true);
		expect(Siwe.prefixRegex instanceof RegExp).toBe(true);
		expect(Siwe.schemeRegex instanceof RegExp).toBe(true);
		expect(Siwe.suffixRegex instanceof RegExp).toBe(true);

		// Errors
		expect(typeof Siwe.InvalidMessageFieldError).toBe("function");
	});

	it("exports compatibility aliases", () => {
		expect(typeof Siwe.create).toBe("function");
		expect(typeof Siwe.parse).toBe("function");
		expect(typeof Siwe.validate).toBe("function");
		expect(typeof Siwe.validateUri).toBe("function");
	});
});

// ============================================================================
// Message Creation Tests
// ============================================================================

describe("Siwe.createMessage", () => {
	it("creates message with required fields", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
		});

		expect(message.domain).toBe("example.com");
		expect(message.address).toBe("0x1234567890123456789012345678901234567890");
		expect(message.uri).toBe("https://example.com");
		expect(message.version).toBe("1");
		expect(message.chainId).toBe(1);
	});

	it("adds generated nonce if not provided", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
		});

		expect(message.nonce).toBeDefined();
		expect(message.nonce).toHaveLength(8);
	});

	it("accepts custom nonce", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
			nonce: "custom123",
		});

		expect(message.nonce).toBe("custom123");
	});

	it("accepts optional fields", () => {
		const issuedAt = new Date().toISOString();
		const expirationTime = new Date(Date.now() + 3600000).toISOString();

		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
			issuedAt,
			expirationTime,
			statement: "Sign in to example.com",
		});

		expect(message.issuedAt).toBe(issuedAt);
		expect(message.expirationTime).toBe(expirationTime);
		expect(message.statement).toBe("Sign in to example.com");
	});
});

// ============================================================================
// Message Parsing Tests
// ============================================================================

describe("Siwe.parseMessage", () => {
	it("parses formatted message string", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
			statement: "Sign in with Ethereum",
		});

		const formatted = Siwe.createMessage(message);
		const parsed = Siwe.parseMessage({
			message: JSON.stringify(formatted),
		});

		expect(parsed.domain).toBe("example.com");
		expect(parsed.address).toBe("0x1234567890123456789012345678901234567890");
		expect(parsed.uri).toBe("https://example.com");
	});

	it("parses message with all fields", () => {
		const issuedAt = new Date("2021-09-30T16:25:24Z").toISOString();
		const expirationTime = new Date("2021-10-30T16:25:24Z").toISOString();

		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
			nonce: "12345678",
			issuedAt,
			expirationTime,
			statement: "Sign in to example.com",
			resources: ["https://example.com/terms", "https://example.com/privacy"],
		});

		const formatted = Siwe.createMessage(message);
		const parsed = Siwe.parseMessage({
			message: JSON.stringify(formatted),
		});

		expect(parsed.statement).toBe("Sign in to example.com");
		expect(parsed.resources).toEqual([
			"https://example.com/terms",
			"https://example.com/privacy",
		]);
	});
});

// ============================================================================
// Message Validation Tests
// ============================================================================

describe("Siwe.validateMessage", () => {
	it("validates correct message", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
		});

		expect(() => {
			Siwe.validateMessage(message);
		}).not.toThrow();
	});

	it("rejects message with invalid domain", () => {
		const message = Siwe.createMessage({
			domain: "invalid domain with spaces",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
		});

		expect(() => {
			Siwe.validateMessage(message);
		}).toThrow();
	});

	it("rejects message with invalid URI", () => {
		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "not-a-valid-uri",
			chainId: 1,
		});

		expect(() => {
			Siwe.validateMessage(message);
		}).toThrow();
	});

	it("rejects expired message", () => {
		const expirationTime = new Date(Date.now() - 1000).toISOString();

		const message = Siwe.createMessage({
			domain: "example.com",
			address: "0x1234567890123456789012345678901234567890",
			uri: "https://example.com",
			chainId: 1,
			expirationTime,
		});

		expect(() => {
			Siwe.validateMessage(message);
		}).toThrow();
	});
});

// ============================================================================
// Nonce Generation Tests
// ============================================================================

describe("Siwe.generateNonce", () => {
	it("generates nonce of correct length", () => {
		const nonce = Siwe.generateNonce();

		expect(nonce).toBeDefined();
		expect(typeof nonce).toBe("string");
		expect(nonce.length).toBe(8);
	});

	it("generates unique nonces", () => {
		const nonce1 = Siwe.generateNonce();
		const nonce2 = Siwe.generateNonce();

		expect(nonce1).not.toBe(nonce2);
	});

	it("generates alphanumeric nonces", () => {
		const nonce = Siwe.generateNonce();

		expect(/^[0-9a-zA-Z]{8}$/.test(nonce)).toBe(true);
	});
});

// ============================================================================
// URI Validation Tests
// ============================================================================

describe("Siwe.isUri", () => {
	it("validates valid URIs", () => {
		expect(Siwe.isUri("https://example.com")).toBe(true);
		expect(Siwe.isUri("http://localhost")).toBe(true);
	});

	it("rejects invalid URIs", () => {
		expect(Siwe.isUri("not-a-uri")).toBe(false);
		expect(Siwe.isUri("example.com")).toBe(false);
	});
});

// ============================================================================
// Regex Pattern Tests
// ============================================================================

describe("Siwe regex patterns", () => {
	it("domainRegex matches valid domains", () => {
		expect(Siwe.domainRegex.test("example.com")).toBe(true);
		expect(Siwe.domainRegex.test("sub.example.com")).toBe(true);
	});

	it("ipRegex matches IP addresses", () => {
		expect(Siwe.ipRegex.test("192.168.1.1")).toBe(true);
		expect(Siwe.ipRegex.test("255.255.255.255")).toBe(true);
	});

	it("nonceRegex matches valid nonces", () => {
		expect(Siwe.nonceRegex.test("12345678")).toBe(true);
		expect(Siwe.nonceRegex.test("abcdefgh")).toBe(true);
	});

	it("schemeRegex matches valid schemes", () => {
		expect(Siwe.schemeRegex.test("https")).toBe(true);
		expect(Siwe.schemeRegex.test("http")).toBe(true);
	});
});

// ============================================================================
// Alias Tests
// ============================================================================

describe("Siwe aliases", () => {
	it("create is alias for createMessage", () => {
		expect(Siwe.create).toBe(Siwe.createMessage);
	});

	it("parse is alias for parseMessage", () => {
		expect(Siwe.parse).toBe(Siwe.parseMessage);
	});

	it("validate is alias for validateMessage", () => {
		expect(Siwe.validate).toBe(Siwe.validateMessage);
	});

	it("validateUri is alias for isUri", () => {
		expect(Siwe.validateUri).toBe(Siwe.isUri);
	});
});
