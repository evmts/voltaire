import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Advanced ENS usage patterns and techniques

console.log("\n===== Advanced ENS Usage =====");

// Factory API vs wrapper API
console.log("\n1. Factory API vs Wrapper API:");
console.log("  Voltaire provides two APIs for ENS operations:");

// Factory API (explicit dependency injection)
import { Namehash, Labelhash } from "../../../primitives/Ens/index.js";
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";

const namehash = Namehash({ keccak256 });
const labelhash = Labelhash({ keccak256 });

const name = Ens.from("vitalik.eth");

// Wrapper API (auto-converts)
const hash1 = Ens.namehash("vitalik.eth");

// Factory API (no conversion, uses branded type)
const hash2 = namehash(name);

console.log("  Wrapper API:  Ens.namehash('vitalik.eth')");
console.log(`    Result: ${Hex.fromBytes(hash1).slice(0, 18)}...`);
console.log("\n  Factory API:  namehash(Ens.from('vitalik.eth'))");
console.log(`    Result: ${Hex.fromBytes(hash2).slice(0, 18)}...`);
console.log(
	`\n  Results match: ${Hex.fromBytes(hash1) === Hex.fromBytes(hash2)}`,
);

// Internal vs public methods
console.log("\n2. Internal vs Public Methods:");
console.log("  _normalize, _beautify, _namehash, _labelhash are internal");
console.log("  normalize, beautify, namehash, labelhash are public wrappers");

const input = "VITALIK.eth";

// Public wrapper (auto-converts)
const publicResult = Ens.normalize(input);

// Internal method (requires branded type)
const branded = Ens.from(input);
const internalResult = Ens._normalize(branded);

console.log(`\n  Input: ${input}`);
console.log(`    Public:   Ens.normalize('${input}') → ${publicResult}`);
console.log(
	`    Internal: Ens._normalize(Ens.from('${input}')) → ${internalResult}`,
);
console.log(`    Results match: ${publicResult === internalResult}`);

// Branded type system
console.log("\n3. Branded Type System:");
console.log("  EnsType is a branded string for type safety");

const regularString: string = "vitalik.eth";
const ensName = Ens.from(regularString);
const backToString = Ens.toString(ensName);

console.log(`  Regular string:  ${regularString}`);
console.log(`  Branded ENS:     ${ensName}`);
console.log(`  Back to string:  ${backToString}`);
console.log(`  Runtime same:    ${regularString === ensName}`);
console.log("  Note: Brand is TypeScript-only, no runtime overhead");

// Type checking
console.log("\n4. Type Checking:");
const testValues = ["vitalik.eth", "", "   ", null, undefined, 123];

console.log("  Ens.is() validates ENS names:");
for (const value of testValues) {
	const isValid = Ens.is(value);
	const repr =
		value === null
			? "null"
			: value === undefined
				? "undefined"
				: typeof value === "string"
					? `"${value}"`
					: String(value);
	console.log(`    ${repr.padEnd(15)} → ${isValid ? "✓" : "✗"}`);
}

// Batch processing
console.log("\n5. Batch Processing:");
const domains = ["vitalik.eth", "nick.eth", "brantly.eth", "dao.eth"];

console.log("  Batch normalize and hash:");
const results = domains.map((domain) => {
	const normalized = Ens.normalize(domain);
	const hash = Ens.namehash(normalized);
	return { domain, normalized, hash };
});

for (const { domain, normalized, hash } of results) {
	console.log(
		`    ${domain.padEnd(15)} → ${normalized.padEnd(15)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Collision detection (hierarchical uniqueness)
console.log("\n6. Collision Detection:");
console.log("  ENS namehash is collision-resistant:");

const similar = [
	"vitalik.eth",
	"vitalik1.eth",
	"vitalikbuterin.eth",
	"buterin.eth",
];

console.log("\n  Similar names have different hashes:");
for (const domain of similar) {
	const hash = Ens.namehash(domain);
	console.log(
		`    ${domain.padEnd(20)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Parent-child relationship verification
console.log("\n7. Parent-Child Relationship:");
console.log("  Verify subdomain relationship:");

const parent = "example.eth";
const children = ["sub1.example.eth", "sub2.example.eth", "different.eth"];

const parentHash = Ens.namehash(parent);
console.log(`\n  Parent: ${parent}`);
console.log(`    Hash: ${Hex.fromBytes(parentHash).slice(0, 18)}...`);

console.log("\n  Children:");
for (const child of children) {
	const childHash = Ens.namehash(child);
	const isChild = child.endsWith(`.${parent}`);
	console.log(
		`    ${child.padEnd(20)} → ${isChild ? "✓ child" : "✗ not child"} → ${Hex.fromBytes(childHash).slice(0, 18)}...`,
	);
}

// Performance considerations
console.log("\n8. Performance Considerations:");
console.log("  Normalization is expensive, cache results when possible");

const testName = "vitalik.eth";
const iterations = 1000;

const normalizeStart = performance.now();
for (let i = 0; i < iterations; i++) {
	Ens.normalize(testName);
}
const normalizeTime = performance.now() - normalizeStart;

const hashStart = performance.now();
const normalized = Ens.normalize(testName);
for (let i = 0; i < iterations; i++) {
	Ens.namehash(normalized);
}
const hashTime = performance.now() - hashStart;

console.log(`\n  ${iterations} iterations of '${testName}':`);
console.log(
	`    Normalize: ${normalizeTime.toFixed(2)}ms (${(normalizeTime / iterations).toFixed(3)}ms each)`,
);
console.log(
	`    Namehash:  ${hashTime.toFixed(2)}ms (${(hashTime / iterations).toFixed(3)}ms each)`,
);
console.log(`\n  Tip: Normalize once, hash many times for best performance`);

// Error recovery
console.log("\n9. Error Recovery:");
console.log("  Handle invalid names gracefully:");

const inputs = ["valid.eth", "invalid\x00.eth", "UPPERCASE.eth"];

for (const input of inputs) {
	try {
		const normalized = Ens.normalize(input);
		const hash = Ens.namehash(normalized);
		console.log(
			`  ✓ ${input.padEnd(20)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
		);
	} catch (error) {
		const errorName = (error as Error).name;
		console.log(`  ✗ ${input.padEnd(20)} → ${errorName}`);
	}
}
