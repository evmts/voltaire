/**
 * Metadata Handling Example
 *
 * Demonstrates:
 * - Detecting Solidity compiler metadata
 * - Stripping metadata from bytecode
 * - Comparing bytecode without metadata
 * - Analyzing metadata presence and size
 * - Extracting metadata sections
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

console.log("\n=== Metadata Handling Example ===\n");

// ============================================================
// Understanding Metadata
// ============================================================

console.log("--- Understanding Metadata ---\n");

console.log("Solidity compiler appends CBOR-encoded metadata to bytecode:");
console.log("  - IPFS hash of source files");
console.log("  - Compiler version");
console.log("  - Compilation settings");
console.log("  - Typically 50-100 bytes at end of bytecode");
console.log("  - Format: [bytecode][metadata_content][0x00][length_byte]");
console.log();

// ============================================================
// Detecting Metadata
// ============================================================

console.log("--- Detecting Metadata ---\n");

// Simulated deployed contract bytecode with metadata
// Real Solidity bytecode ends with metadata marker: 0xa2 0x64 'i' 'p' 'f' 's' ...
const withMetadata = Bytecode.fromHex(
	"0x6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063a264697066733a2212201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef64736f6c634300080f0033",
);

const withoutMetadata = Bytecode.fromHex("0x60016002015b00");

console.log(`With metadata: ${Bytecode.hasMetadata(withMetadata)}`);
console.log(`Without metadata: ${Bytecode.hasMetadata(withoutMetadata)}`);
console.log();

// ============================================================
// Stripping Metadata
// ============================================================

console.log("--- Stripping Metadata ---\n");

console.log(`Original size: ${Bytecode.size(withMetadata)} bytes`);
console.log(`Has metadata: ${Bytecode.hasMetadata(withMetadata)}`);

const stripped = Bytecode.stripMetadata(withMetadata);

console.log(`\nAfter stripping:`);
console.log(`  Size: ${Bytecode.size(stripped)} bytes`);
console.log(`  Has metadata: ${Bytecode.hasMetadata(stripped)}`);
console.log(
	`  Removed: ${Bytecode.size(withMetadata) - Bytecode.size(stripped)} bytes`,
);
console.log();

// Stripping bytecode without metadata returns same reference
const noMetaStripped = Bytecode.stripMetadata(withoutMetadata);
console.log(
	`Stripping code without metadata: ${noMetaStripped === withoutMetadata ? "same reference" : "new copy"}`,
);
console.log();

// ============================================================
// Comparing Bytecode Without Metadata
// ============================================================

console.log("--- Comparing Bytecode Without Metadata ---\n");

// Simulate two versions of same contract compiled at different times
// (Different metadata but same code)
const version1 = Bytecode.fromHex(
	"0x6001600201a264697066733a2212201111111111111111111111111111111111111111111111111111111111111111640033",
);

const version2 = Bytecode.fromHex(
	"0x6001600201a264697066733a2212202222222222222222222222222222222222222222222222222222222222222222640033",
);

console.log(`Version 1: ${Bytecode.toHex(version1).substring(0, 40)}...`);
console.log(`Version 2: ${Bytecode.toHex(version2).substring(0, 40)}...`);
console.log();

console.log("Direct comparison:");
console.log(`  Equals: ${Bytecode.equals(version1, version2)}`);

console.log("\nAfter stripping metadata:");
const v1Stripped = Bytecode.stripMetadata(version1);
const v2Stripped = Bytecode.stripMetadata(version2);
console.log(`  Equals: ${Bytecode.equals(v1Stripped, v2Stripped)}`);
console.log();

// ============================================================
// Extracting Metadata Section
// ============================================================

console.log("--- Extracting Metadata Section ---\n");

function extractMetadata(code: typeof Bytecode.prototype): Uint8Array | null {
	if (!Bytecode.hasMetadata(code)) {
		return null;
	}

	const lengthByte = code[code.length - 1];
	const metadataLength = lengthByte + 2;

	return code.slice(-metadataLength);
}

const metadata = extractMetadata(withMetadata);

if (metadata) {
	console.log(`Metadata section: ${metadata.length} bytes`);
	const hex = Array.from(metadata)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	console.log(`Hex: 0x${hex}`);
	console.log();
}

// ============================================================
// Analyzing Metadata Presence
// ============================================================

console.log("--- Analyzing Metadata Presence ---\n");

function analyzeMetadata(code: typeof Bytecode.prototype) {
	const hasMeta = Bytecode.hasMetadata(code);

	if (!hasMeta) {
		return {
			hasMetadata: false,
			totalSize: Bytecode.size(code),
			codeSize: Bytecode.size(code),
			metadataSize: 0,
			metadataPercent: 0,
		};
	}

	const stripped = Bytecode.stripMetadata(code);
	const metadata = extractMetadata(code)!;

	return {
		hasMetadata: true,
		totalSize: Bytecode.size(code),
		codeSize: Bytecode.size(stripped),
		metadataSize: metadata.length,
		metadataPercent: ((metadata.length / code.length) * 100).toFixed(2),
	};
}

const analysis = analyzeMetadata(withMetadata);

console.log("Metadata analysis:");
console.log(`  Has metadata: ${analysis.hasMetadata}`);
console.log(`  Total size: ${analysis.totalSize} bytes`);
console.log(`  Code size: ${analysis.codeSize} bytes`);
console.log(`  Metadata size: ${analysis.metadataSize} bytes`);
console.log(`  Metadata: ${analysis.metadataPercent}% of total`);
console.log();

// ============================================================
// Contract Verification Pattern
// ============================================================

console.log("--- Contract Verification Pattern ---\n");

async function verifyContract(
	deployedCode: typeof Bytecode.prototype,
	expectedCode: typeof Bytecode.prototype,
): Promise<boolean> {
	const deployedStripped = Bytecode.stripMetadata(deployedCode);
	const expectedStripped = Bytecode.stripMetadata(expectedCode);

	return Bytecode.equals(deployedStripped, expectedStripped);
}

const deployed = Bytecode.fromHex(
	"0x6001600201a264697066733a221220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa640033",
);

const expected = Bytecode.fromHex(
	"0x6001600201a264697066733a221220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb640033",
);

const verified = await verifyContract(deployed, expected);

console.log("Contract verification:");
console.log(`  Deployed: ${Bytecode.toHex(deployed).substring(0, 40)}...`);
console.log(`  Expected: ${Bytecode.toHex(expected).substring(0, 40)}...`);
console.log(`  Verified: ${verified}`);
console.log();

// ============================================================
// Finding Matching Version
// ============================================================

console.log("--- Finding Matching Version ---\n");

function findMatchingVersion(
	deployed: typeof Bytecode.prototype,
	versions: (typeof Bytecode.prototype)[],
): number {
	const deployedStripped = Bytecode.stripMetadata(deployed);

	for (let i = 0; i < versions.length; i++) {
		const versionStripped = Bytecode.stripMetadata(versions[i]);

		if (Bytecode.equals(deployedStripped, versionStripped)) {
			return i;
		}
	}

	return -1;
}

const deployedContract = Bytecode.fromHex(
	"0x60ff60aaaaa264697066733a221220cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc640033",
);

const compiledVersions = [
	Bytecode.fromHex("0x60016002015b00"), // Different code
	Bytecode.fromHex(
		"0x60ff60aaaaa264697066733a221220dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd640033",
	), // Match!
	Bytecode.fromHex("0x6001600201"), // Different code
];

const matchIndex = findMatchingVersion(deployedContract, compiledVersions);

console.log("Searching for matching version:");
compiledVersions.forEach((v, i) => {
	const mark = i === matchIndex ? " <- MATCH" : "";
	console.log(
		`  Version ${i}: ${Bytecode.toHex(v).substring(0, 30)}...${mark}`,
	);
});
console.log(`\nFound match at index: ${matchIndex}`);
console.log();

// ============================================================
// Batch Verification
// ============================================================

console.log("--- Batch Verification ---\n");

interface ContractPair {
	name: string;
	deployed: typeof Bytecode.prototype;
	expected: typeof Bytecode.prototype;
}

const contracts: ContractPair[] = [
	{
		name: "Token",
		deployed: Bytecode.fromHex("0x60016002a264697066733a221220aaaa640033"),
		expected: Bytecode.fromHex("0x60016002a264697066733a221220bbbb640033"),
	},
	{
		name: "NFT",
		deployed: Bytecode.fromHex("0x60ff60aaa264697066733a221220cccc640033"),
		expected: Bytecode.fromHex("0x60ff60aaa264697066733a221220dddd640033"),
	},
	{
		name: "Vault",
		deployed: Bytecode.fromHex("0x6001"),
		expected: Bytecode.fromHex("0x60ff"),
	},
];

console.log("Verifying multiple contracts:");

for (const contract of contracts) {
	const verified = await verifyContract(contract.deployed, contract.expected);
	const status = verified ? "VERIFIED" : "FAILED";
	console.log(`  ${contract.name}: ${status}`);
}
console.log();

// ============================================================
// Metadata Caching Pattern
// ============================================================

console.log("--- Metadata Caching Pattern ---\n");

const strippedCache = new WeakMap<
	typeof Bytecode.prototype,
	typeof Bytecode.prototype
>();

function getCachedStripped(
	code: typeof Bytecode.prototype,
): typeof Bytecode.prototype {
	if (!strippedCache.has(code)) {
		strippedCache.set(code, Bytecode.stripMetadata(code));
	}
	return strippedCache.get(code)!;
}

// Usage: avoid repeated stripping
const testCode = Bytecode.fromHex("0x6001600201a264697066733a221220eeee640033");

console.log("First call (strips and caches):");
const stripped1 = getCachedStripped(testCode);
console.log(`  Size: ${Bytecode.size(stripped1)} bytes`);

console.log("\nSecond call (returns cached):");
const stripped2 = getCachedStripped(testCode);
console.log(`  Size: ${Bytecode.size(stripped2)} bytes`);
console.log(`  Same reference: ${stripped1 === stripped2}`);
console.log();

// ============================================================
// Edge Cases
// ============================================================

console.log("--- Edge Cases ---\n");

// Empty bytecode
const empty = Bytecode.fromHex("0x");
console.log(`Empty bytecode has metadata: ${Bytecode.hasMetadata(empty)}`);

// Very short bytecode (< 2 bytes)
const short = Bytecode.fromHex("0x00");
console.log(`Short bytecode has metadata: ${Bytecode.hasMetadata(short)}`);

// Bytecode ending with metadata-like pattern (false positive)
const falsePositive = Bytecode.fromHex("0x60003300");
console.log(
	`False positive has metadata: ${Bytecode.hasMetadata(falsePositive)} (may be false positive)`,
);
console.log();

console.log("=== Example Complete ===\n");
