import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: ENS Labelhash - hashing individual labels

// Labelhash is simply keccak256(label)
// It's used as a building block in the namehash algorithm

console.log("\n===== ENS Labelhash =====");

// Basic labels
console.log("\n1. Basic Labels:");
const basicLabels = ["eth", "com", "xyz", "org", "io"];

for (const label of basicLabels) {
	const hash = Ens.labelhash(label);
	console.log(`  ${label.padEnd(6)} → ${Hex.fromBytes(hash)}`);
}

// Common ENS labels
console.log("\n2. Common ENS Labels:");
const commonLabels = ["vitalik", "nick", "brantly", "dao", "app", "www"];

for (const label of commonLabels) {
	const hash = Ens.labelhash(label);
	console.log(`  ${label.padEnd(10)} → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Subdomain labels
console.log("\n3. Subdomain Labels:");
const subLabels = ["sub", "test", "staging", "prod", "api", "app"];

for (const label of subLabels) {
	const hash = Ens.labelhash(label);
	console.log(`  ${label.padEnd(10)} → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Special characters and numbers
console.log("\n4. Numbers and Special Characters:");
const specialLabels = ["123", "456eth", "my-name", "test_domain", "0x123"];

for (const label of specialLabels) {
	const hash = Ens.labelhash(label);
	console.log(`  ${label.padEnd(12)} → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Case sensitivity in labelhash
console.log("\n5. Case Sensitivity:");
const caseExamples = [
	["vitalik", "VITALIK", "Vitalik"],
	["eth", "ETH", "Eth"],
	["test", "TEST", "Test"],
];

for (const [lower, upper, mixed] of caseExamples) {
	const lowerHash = Ens.labelhash(lower);
	const upperHash = Ens.labelhash(upper);
	const mixedHash = Ens.labelhash(mixed);

	console.log(`\n  Label variations of "${lower}":`);
	console.log(
		`    ${lower.padEnd(10)} → ${Hex.fromBytes(lowerHash).slice(0, 18)}...`,
	);
	console.log(
		`    ${upper.padEnd(10)} → ${Hex.fromBytes(upperHash).slice(0, 18)}...`,
	);
	console.log(
		`    ${mixed.padEnd(10)} → ${Hex.fromBytes(mixedHash).slice(0, 18)}...`,
	);
	console.log(
		`    All match: ${
			Hex.fromBytes(lowerHash) === Hex.fromBytes(upperHash) &&
			Hex.fromBytes(upperHash) === Hex.fromBytes(mixedHash)
		}`,
	);
}

// Relationship to namehash
console.log("\n6. Relationship to Namehash:");
console.log("  Labelhash is used as building block in namehash algorithm");
console.log(
	"  namehash('label.eth') = keccak256(namehash('eth') || labelhash('label'))",
);

const label = "vitalik";
const labelHash = Ens.labelhash(label);
const nameHash = Ens.namehash(`${label}.eth`);

console.log(
	`\n    labelhash('${label}')  → ${Hex.fromBytes(labelHash).slice(0, 18)}...`,
);
console.log(
	`    namehash('${label}.eth') → ${Hex.fromBytes(nameHash).slice(0, 18)}...`,
);
console.log(`\n  These are different! Labelhash hashes single labels,`);
console.log(`  while namehash recursively hashes the entire hierarchy.`);
