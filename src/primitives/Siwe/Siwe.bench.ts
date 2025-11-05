/**
 * SIWE Benchmarks
 *
 * Measures performance of Sign-In with Ethereum operations
 */

import type { BrandedMessage } from "./BrandedMessage.js";
import * as Siwe from "./Siwe.js";

// Benchmark runner
interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		try {
			fn();
		} catch {
			// Ignore errors during warmup
		}
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		try {
			fn();
		} catch {
			// Count iteration even if it throws
		}
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data
// ============================================================================

function createTestAddress(seed: number) {
	const addr = new Uint8Array(20);
	addr.fill(seed);
	return addr;
}

const testAddress = createTestAddress(1);
const testSignature = new Uint8Array(65);

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
	statement: "Sign in to Example App",
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

// ============================================================================
// Message Creation Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("SIWE MESSAGE CREATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Message Creation ---");
results.push(
	benchmark("Siwe.create - minimal fields", () =>
		Siwe.create({
			domain: "example.com",
			address: testAddress,
			uri: "https://example.com",
			chainId: 1,
		}),
	),
);

results.push(
	benchmark("Siwe.create - with statement", () =>
		Siwe.create({
			domain: "example.com",
			address: testAddress,
			uri: "https://example.com",
			chainId: 1,
			statement: "Sign in to Example",
		}),
	),
);

results.push(
	benchmark("Siwe.create - all fields", () =>
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
		}),
	),
);

results.push(
	benchmark("Siwe.create - custom nonce", () =>
		Siwe.create({
			domain: "example.com",
			address: testAddress,
			uri: "https://example.com",
			chainId: 1,
			nonce: "customnonce123",
		}),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Nonce Generation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("NONCE GENERATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Nonce Generation ---");
results.push(
	benchmark("generateNonce - default length (11)", () => Siwe.generateNonce()),
);

results.push(benchmark("generateNonce - 8 chars", () => Siwe.generateNonce(8)));

results.push(
	benchmark("generateNonce - 16 chars", () => Siwe.generateNonce(16)),
);

results.push(
	benchmark("generateNonce - 32 chars", () => Siwe.generateNonce(32)),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Message Formatting Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("MESSAGE FORMATTING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Standard Form ---");
results.push(
	benchmark("Message.format - basic", () => Siwe.format(basicMessage)),
);

results.push(
	benchmark("Message.format - with statement", () =>
		Siwe.format(messageWithStatement),
	),
);

results.push(
	benchmark("Message.format - all fields", () =>
		Siwe.format(messageWithAllFields),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Public Wrapper ---");
results.push(benchmark("format - basic", () => Siwe.format(basicMessage)));

results.push(
	benchmark("format - all fields", () => Siwe.format(messageWithAllFields)),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Message Parsing Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("MESSAGE PARSING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Parsing ---");
results.push(
	benchmark("parse - basic message", () => Siwe.parse(formattedBasic)),
);

results.push(
	benchmark("parse - complex message", () => Siwe.parse(formattedComplex)),
);

const formattedWithMultilineStatement = `example.com wants you to sign in with your Ethereum account:
0x0101010101010101010101010101010101010101

This is a multi-line
statement for signing in

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 12345678
Issued At: 2021-09-30T16:25:24.000Z`;

results.push(
	benchmark("parse - multiline statement", () =>
		Siwe.parse(formattedWithMultilineStatement),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Standard Form ---");
results.push(
	benchmark("Message.validate - basic", () => Siwe.validate(basicMessage)),
);

results.push(
	benchmark("Message.validate - with timestamps", () => {
		const now = new Date("2021-09-30T18:00:00.000Z");
		Siwe.validate(messageWithAllFields, { now });
	}),
);

const invalidMessage = { ...basicMessage, version: "2" as "1" };
results.push(
	benchmark("Message.validate - invalid version", () =>
		Siwe.validate(invalidMessage),
	),
);

const expiredMessage = {
	...basicMessage,
	expirationTime: "2021-09-30T15:00:00.000Z",
};
results.push(
	benchmark("Message.validate - expired", () => {
		const now = new Date("2021-09-30T18:00:00.000Z");
		Siwe.validate(expiredMessage, { now });
	}),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Public Wrapper ---");
results.push(benchmark("validate - basic", () => Siwe.validate(basicMessage)));

results.push(
	benchmark("validate - with options", () => {
		const now = new Date("2021-09-30T18:00:00.000Z");
		Siwe.validate(messageWithAllFields, { now });
	}),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ROUND-TRIP BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Format + Parse ---");
results.push(
	benchmark("roundtrip - basic message", () => {
		const formatted = Siwe.format(basicMessage);
		Siwe.parse(formatted);
	}),
);

results.push(
	benchmark("roundtrip - complex message", () => {
		const formatted = Siwe.format(messageWithAllFields);
		Siwe.parse(formatted);
	}),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Format + Parse + Validate ---");
results.push(
	benchmark("full cycle - basic", () => {
		const formatted = Siwe.format(basicMessage);
		const parsed = Siwe.parse(formatted);
		Siwe.validate(parsed);
	}),
);

results.push(
	benchmark("full cycle - complex", () => {
		const formatted = Siwe.format(messageWithAllFields);
		const parsed = Siwe.parse(formatted);
		Siwe.validate(parsed);
	}),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Signature Operations (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("SIGNATURE OPERATIONS (Not Implemented)");
console.log(
	"================================================================================\n",
);

console.log("--- Signature Verification ---");
results.push(
	benchmark("Message.getMessageHash", () => {
		try {
			Siwe.getMessageHash(basicMessage);
		} catch {
			// Expected - not implemented
		}
	}),
);

results.push(
	benchmark("Message.verify", () => {
		try {
			Siwe.verify(basicMessage, testSignature);
		} catch {
			// Expected - not implemented
		}
	}),
);

results.push(
	benchmark("verifyMessage", () => {
		try {
			Siwe.verifyMessage(basicMessage, testSignature);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

// ============================================================================
// Address Formatting Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ADDRESS FORMATTING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Address to Hex Conversion (in format) ---");
const addresses = [
	createTestAddress(0),
	createTestAddress(42),
	createTestAddress(255),
	new Uint8Array(20).fill(0xff),
];

for (const addr of addresses) {
	const msg = { ...basicMessage, address: addr };
	results.push(
		benchmark(
			`format with address 0x${addr[0]?.toString(16).padStart(2, "0")}...`,
			() => Siwe.format(msg),
		),
	);
}

console.log(
	results
		.slice(-addresses.length)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Performance Characteristics
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("PERFORMANCE CHARACTERISTICS");
console.log(
	"================================================================================\n",
);

// Measure impact of statement length
console.log("--- Statement Length Impact ---");
const statementLengths = [0, 10, 100, 1000];
for (const len of statementLengths) {
	const statement = "a".repeat(len);
	const msg = len === 0 ? basicMessage : { ...basicMessage, statement };
	results.push(
		benchmark(`format - statement length ${len}`, () => Siwe.format(msg)),
	);
}

console.log(
	results
		.slice(-statementLengths.length)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// Measure impact of resources count
console.log("\n--- Resources Count Impact ---");
const resourceCounts = [0, 1, 5, 10];
for (const count of resourceCounts) {
	const resources = Array(count)
		.fill("")
		.map((_, i) => `https://example.com/resource${i}`);
	const msg = count === 0 ? basicMessage : { ...basicMessage, resources };
	results.push(
		benchmark(`format - ${count} resources`, () => Siwe.format(msg)),
	);
}

console.log(
	results
		.slice(-resourceCounts.length)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("Benchmarks complete!");
console.log(
	"================================================================================",
);
console.log(`\nTotal benchmarks run: ${results.length}`);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(`\nFastest operation: ${sorted[0]?.name}`);
console.log(
	`  ${sorted[0]?.opsPerSec.toFixed(0)} ops/sec (${sorted[0]?.avgTimeMs.toFixed(4)} ms/op)`,
);
console.log(`\nSlowest operation: ${sorted[sorted.length - 1]?.name}`);
console.log(
	`  ${sorted[sorted.length - 1]?.opsPerSec.toFixed(0)} ops/sec (${sorted[sorted.length - 1]?.avgTimeMs.toFixed(4)} ms/op)`,
);

console.log("\nNote: Signature operations throw 'Not implemented'");
console.log(
	"Real performance metrics will be available after implementation.\n",
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/siwe-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
