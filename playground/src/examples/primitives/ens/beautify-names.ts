import * as Ens from "../../../primitives/Ens/index.js";

// Example: ENS name beautification - normalize while preserving emoji

// Beautify normalizes ENS names but preserves emoji presentation
// This is useful for display purposes while maintaining canonical form

console.log("\n===== ENS Name Beautification =====");

// Basic beautification
console.log("\n1. Basic Beautification:");
const basicExamples = [
	"VITALIK.eth",
	"Nick.ETH",
	"TestName.eth",
	"UPPERCASE.eth",
	"MixedCase.ETH",
];

console.log("\n  Beautification (normalizes case):");
for (const name of basicExamples) {
	const beautified = Ens.beautify(name);
	console.log(`  ${name.padEnd(20)} → ${beautified}`);
}

// Compare beautify vs normalize
console.log("\n2. Beautify vs Normalize:");
const compareExamples = ["TEST.eth", "CamelCase.eth", "lowercase.eth"];

for (const name of compareExamples) {
	const normalized = Ens.normalize(name);
	const beautified = Ens.beautify(name);
	const same = normalized === beautified;

	console.log(`\n  ${name}`);
	console.log(`    normalize() → ${normalized}`);
	console.log(`    beautify()  → ${beautified}`);
	console.log(`    Same result: ${same ? "✓" : "✗"}`);
}

// Emoji handling
console.log("\n3. Emoji Handling:");
const emojiExamples = ["💩.eth", "🚀.eth", "❤️.eth", "🌟.eth", "🔥.eth"];

console.log("\n  Emoji preservation:");
for (const name of emojiExamples) {
	try {
		const beautified = Ens.beautify(name);
		console.log(`  ${name.padEnd(12)} → ${beautified.padEnd(12)} (preserved)`);
	} catch (error) {
		console.log(`  ${name.padEnd(12)} → Error: ${(error as Error).name}`);
	}
}

// Mixed emoji and text
console.log("\n4. Mixed Emoji and Text:");
const mixedExamples = ["rocket🚀.eth", "love❤️.eth", "fire🔥test.eth"];

for (const name of mixedExamples) {
	try {
		const beautified = Ens.beautify(name);
		console.log(`  ${name.padEnd(20)} → ${beautified}`);
	} catch (error) {
		console.log(`  ${name.padEnd(20)} → Error: ${(error as Error).name}`);
	}
}

// Unicode characters
console.log("\n5. Unicode Characters:");
const unicodeExamples = [
	{ name: "café.eth", desc: "accented characters" },
	{ name: "münchen.eth", desc: "German umlaut" },
	{ name: "日本.eth", desc: "Japanese characters" },
	{ name: "москва.eth", desc: "Cyrillic characters" },
];

for (const { name, desc } of unicodeExamples) {
	try {
		const beautified = Ens.beautify(name);
		console.log(`  ${name.padEnd(16)} (${desc.padEnd(22)}) → ${beautified}`);
	} catch (error) {
		console.log(
			`  ${name.padEnd(16)} (${desc.padEnd(22)}) → ${(error as Error).name}`,
		);
	}
}

// Display vs canonical form
console.log("\n6. Display vs Canonical Form:");
console.log("  Beautify is useful for display while normalize is for hashing");

const displayExamples = ["MyCompany.eth", "TestDomain.eth"];

for (const name of displayExamples) {
	const normalized = Ens.normalize(name);
	const beautified = Ens.beautify(name);

	console.log(`\n  Input: ${name}`);
	console.log(`    For display:  ${beautified}`);
	console.log(`    For hashing:  ${normalized}`);
}

// Subdomain beautification
console.log("\n7. Subdomain Beautification:");
const subdomainExamples = [
	"App.Company.eth",
	"Test.Domain.ETH",
	"SUB.DOMAIN.eth",
];

for (const name of subdomainExamples) {
	const beautified = Ens.beautify(name);
	console.log(`  ${name.padEnd(20)} → ${beautified}`);
}

// Error handling
console.log("\n8. Error Handling:");
const invalidExamples = [
	{ name: "invalid\x00.eth", desc: "null byte" },
	{ name: "control\x01.eth", desc: "control character" },
];

for (const { name, desc } of invalidExamples) {
	try {
		Ens.beautify(name);
		console.log(`  ✗ ${desc.padEnd(20)} → Should have thrown error`);
	} catch (error) {
		console.log(`  ✓ ${desc.padEnd(20)} → Rejected: ${(error as Error).name}`);
	}
}

// Practical use case
console.log("\n9. Practical Use Case:");
console.log(
	"  Use beautify() for UI display, normalize() for on-chain operations",
);

const practical = "VitalIK.ETH";
console.log(`\n  User input: ${practical}`);
console.log(`    Display in UI:    ${Ens.beautify(practical)}`);
console.log(`    Store/hash:       ${Ens.normalize(practical)}`);
console.log(
	`\n  This ensures consistent canonical form while maintaining readability`,
);
