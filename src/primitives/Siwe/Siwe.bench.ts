/**
 * Benchmark: SIWE (Sign-In with Ethereum) operations
 * Compares voltaire SIWE against siwe package
 */

import { bench, run } from "mitata";
import { Address } from "../Address/index.js";
import * as Siwe from "./index.js";
import type { BrandedMessage } from "./SiweMessageType.js";

// ============================================================================
// Test Data
// ============================================================================

function createTestAddress(seed: number) {
	const addr = new Uint8Array(20);
	addr.fill(seed);
	return Address.fromBytes(addr);
}

const testAddress = createTestAddress(1);
const testSignature = new Uint8Array(65);
testSignature.fill(0x42);

const basicMessage: BrandedMessage = {
	domain: "example.com",
	address: testAddress,
	uri: "https://example.com/login",
	version: "1",
	chainId: 1,
	nonce: "12345678",
	issuedAt: "2021-09-30T16:25:24.000Z",
};

const messageWithStatement: BrandedMessage = {
	...basicMessage,
	statement: "Sign in to Example App",
};

const messageWithAllFields: BrandedMessage = {
	...basicMessage,
	statement: "Sign in to Example App with all the optional fields included for comprehensive testing",
	expirationTime: "2021-10-01T16:25:24.000Z",
	notBefore: "2021-09-30T16:00:00.000Z",
	requestId: "request-123",
	resources: [
		"https://example.com/resource1",
		"https://example.com/resource2",
		"https://example.com/resource3",
	],
};

const formattedBasic = Siwe.format(basicMessage);
const formattedComplex = Siwe.format(messageWithAllFields);

const formattedWithMultilineStatement = `example.com wants you to sign in with your Ethereum account:
0x0101010101010101010101010101010101010101

This is a multi-line
statement for signing in

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 12345678
Issued At: 2021-09-30T16:25:24.000Z`;

// ============================================================================
// create
// ============================================================================

bench("Siwe.create - minimal fields - voltaire", () => {
	Siwe.create({
		domain: "example.com",
		address: testAddress,
		uri: "https://example.com",
		chainId: 1,
	});
});

bench("Siwe.create - with statement - voltaire", () => {
	Siwe.create({
		domain: "example.com",
		address: testAddress,
		uri: "https://example.com",
		chainId: 1,
		statement: "Sign in to Example",
	});
});

bench("Siwe.create - all fields - voltaire", () => {
	Siwe.create({
		domain: "example.com",
		address: testAddress,
		uri: "https://example.com",
		chainId: 1,
		statement: "Sign in to Example",
		expirationTime: "2021-10-01T16:25:24.000Z",
		notBefore: "2021-09-30T16:00:00.000Z",
		requestId: "request-123",
		resources: [
			"https://example.com/resource1",
			"https://example.com/resource2",
		],
	});
});

await run();

// ============================================================================
// generateNonce
// ============================================================================

bench("Siwe.generateNonce - default (11 chars) - voltaire", () => {
	Siwe.generateNonce();
});

bench("Siwe.generateNonce - 8 chars - voltaire", () => {
	Siwe.generateNonce(8);
});

bench("Siwe.generateNonce - 32 chars - voltaire", () => {
	Siwe.generateNonce(32);
});

await run();

// ============================================================================
// format
// ============================================================================

bench("Siwe.format - basic - voltaire", () => {
	Siwe.format(basicMessage);
});

bench("Siwe.format - with statement - voltaire", () => {
	Siwe.format(messageWithStatement);
});

bench("Siwe.format - all fields - voltaire", () => {
	Siwe.format(messageWithAllFields);
});

await run();

// ============================================================================
// parse
// ============================================================================

bench("Siwe.parse - basic message - voltaire", () => {
	Siwe.parse(formattedBasic);
});

bench("Siwe.parse - complex message - voltaire", () => {
	Siwe.parse(formattedComplex);
});

bench("Siwe.parse - multiline statement - voltaire", () => {
	Siwe.parse(formattedWithMultilineStatement);
});

await run();

// ============================================================================
// validate
// ============================================================================

bench("Siwe.validate - basic - voltaire", () => {
	Siwe.validate(basicMessage);
});

bench("Siwe.validate - with timestamps - voltaire", () => {
	const now = new Date("2021-09-30T18:00:00.000Z");
	Siwe.validate(messageWithAllFields, { now });
});

const expiredMessage = {
	...basicMessage,
	expirationTime: "2021-09-30T15:00:00.000Z",
};

bench("Siwe.validate - expired message - voltaire", () => {
	const now = new Date("2021-09-30T18:00:00.000Z");
	Siwe.validate(expiredMessage, { now });
});

await run();

// ============================================================================
// getMessageHash (crypto operation)
// ============================================================================

bench("Siwe.getMessageHash - basic - voltaire", () => {
	Siwe.getMessageHash(basicMessage);
});

bench("Siwe.getMessageHash - complex - voltaire", () => {
	Siwe.getMessageHash(messageWithAllFields);
});

await run();

// ============================================================================
// roundtrip (format + parse)
// ============================================================================

bench("Siwe roundtrip - format + parse - basic - voltaire", () => {
	const formatted = Siwe.format(basicMessage);
	Siwe.parse(formatted);
});

bench("Siwe roundtrip - format + parse - complex - voltaire", () => {
	const formatted = Siwe.format(messageWithAllFields);
	Siwe.parse(formatted);
});

await run();

// ============================================================================
// full cycle (format + parse + validate)
// ============================================================================

bench("Siwe full cycle - format + parse + validate - basic - voltaire", () => {
	const formatted = Siwe.format(basicMessage);
	const parsed = Siwe.parse(formatted);
	Siwe.validate(parsed);
});

bench("Siwe full cycle - format + parse + validate - complex - voltaire", () => {
	const formatted = Siwe.format(messageWithAllFields);
	const parsed = Siwe.parse(formatted);
	Siwe.validate(parsed);
});

await run();

// ============================================================================
// statement length variations
// ============================================================================

const shortStatement = { ...basicMessage, statement: "a".repeat(10) };
const mediumStatement = { ...basicMessage, statement: "a".repeat(100) };
const longStatement = { ...basicMessage, statement: "a".repeat(1000) };

bench("Siwe.format - statement 10 chars - voltaire", () => {
	Siwe.format(shortStatement);
});

bench("Siwe.format - statement 100 chars - voltaire", () => {
	Siwe.format(mediumStatement);
});

bench("Siwe.format - statement 1000 chars - voltaire", () => {
	Siwe.format(longStatement);
});

await run();

// ============================================================================
// resource count variations
// ============================================================================

const oneResource = { ...basicMessage, resources: ["https://example.com/r1"] };
const fiveResources = {
	...basicMessage,
	resources: Array(5).fill("").map((_, i) => `https://example.com/r${i}`),
};
const tenResources = {
	...basicMessage,
	resources: Array(10).fill("").map((_, i) => `https://example.com/r${i}`),
};

bench("Siwe.format - 1 resource - voltaire", () => {
	Siwe.format(oneResource);
});

bench("Siwe.format - 5 resources - voltaire", () => {
	Siwe.format(fiveResources);
});

bench("Siwe.format - 10 resources - voltaire", () => {
	Siwe.format(tenResources);
});

await run();
