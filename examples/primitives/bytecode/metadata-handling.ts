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

// Simulated deployed contract bytecode with metadata
// Real Solidity bytecode ends with metadata marker: 0xa2 0x64 'i' 'p' 'f' 's' ...
const withMetadata = Bytecode.fromHex(
	"0x6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063a264697066733a2212201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef64736f6c634300080f0033",
);

const withoutMetadata = Bytecode.fromHex("0x60016002015b00");

const stripped = Bytecode.stripMetadata(withMetadata);

// Stripping bytecode without metadata returns same reference
const noMetaStripped = Bytecode.stripMetadata(withoutMetadata);

// Simulate two versions of same contract compiled at different times
// (Different metadata but same code)
const version1 = Bytecode.fromHex(
	"0x6001600201a264697066733a2212201111111111111111111111111111111111111111111111111111111111111111640033",
);

const version2 = Bytecode.fromHex(
	"0x6001600201a264697066733a2212202222222222222222222222222222222222222222222222222222222222222222640033",
);
const v1Stripped = Bytecode.stripMetadata(version1);
const v2Stripped = Bytecode.stripMetadata(version2);

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
	const hex = Array.from(metadata)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

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
	const metadata = extractMetadata(code);
	if (!metadata) {
		throw new Error("Expected metadata but extraction failed");
	}

	return {
		hasMetadata: true,
		totalSize: Bytecode.size(code),
		codeSize: Bytecode.size(stripped),
		metadataSize: metadata.length,
		metadataPercent: ((metadata.length / code.length) * 100).toFixed(2),
	};
}

const analysis = analyzeMetadata(withMetadata);

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
compiledVersions.forEach((v, i) => {
	const mark = i === matchIndex ? " <- MATCH" : "";
});

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

for (const contract of contracts) {
	const verified = await verifyContract(contract.deployed, contract.expected);
	const status = verified ? "VERIFIED" : "FAILED";
}

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
	const cached = strippedCache.get(code);
	if (!cached) {
		throw new Error("Cache miss immediately after set");
	}
	return cached;
}

// Usage: avoid repeated stripping
const testCode = Bytecode.fromHex("0x6001600201a264697066733a221220eeee640033");
const stripped1 = getCachedStripped(testCode);
const stripped2 = getCachedStripped(testCode);

// Empty bytecode
const empty = Bytecode.fromHex("0x");

// Very short bytecode (< 2 bytes)
const short = Bytecode.fromHex("0x00");

// Bytecode ending with metadata-like pattern (false positive)
const falsePositive = Bytecode.fromHex("0x60003300");
