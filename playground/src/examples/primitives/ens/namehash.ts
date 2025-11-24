import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: ENS Namehash Algorithm (EIP-137)

// Namehash is a hierarchical hashing algorithm that produces a unique hash
// for each ENS name. It's computed recursively from right to left:
// namehash(name) = keccak256(namehash(parent) || labelhash(label))

console.log("\n===== ENS Namehash Algorithm =====");

// Root hash (empty string = 32 zero bytes)
console.log("\n1. Root Hash:");
const rootHash = Ens.namehash("");
console.log(`  "" → ${Hex.fromBytes(rootHash)}`);

// Single label hashes
console.log("\n2. Single Label Hashes:");
const singleLabels = ["eth", "com", "xyz"];

for (const label of singleLabels) {
	const hash = Ens.namehash(label);
	console.log(`  ${label.padEnd(6)} → ${Hex.fromBytes(hash)}`);
}

// Two-level domain hashes
console.log("\n3. Two-Level Domains:");
const domains = ["vitalik.eth", "nick.eth", "brantly.eth", "example.com"];

for (const domain of domains) {
	const hash = Ens.namehash(domain);
	console.log(
		`  ${domain.padEnd(15)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Subdomain hashes (3+ levels)
console.log("\n4. Subdomain Hashes:");
const subdomains = [
	"sub.vitalik.eth",
	"test.example.eth",
	"deep.sub.domain.eth",
	"very.deep.sub.domain.eth",
];

for (const subdomain of subdomains) {
	const hash = Ens.namehash(subdomain);
	console.log(
		`  ${subdomain.padEnd(28)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Famous ENS names
console.log("\n5. Famous ENS Names:");
const famousNames = ["vitalik.eth", "nick.eth", "brantly.eth", "dao.eth"];

for (const name of famousNames) {
	const hash = Ens.namehash(name);
	console.log(`  ${name.padEnd(15)} → ${Hex.fromBytes(hash)}`);
}

// Demonstrating hierarchical relationship
console.log("\n6. Hierarchical Relationship:");
console.log("  Each subdomain hash is computed from its parent:");

const base = "example.eth";
const sub = "sub.example.eth";
const deep = "deep.sub.example.eth";

const baseHash = Ens.namehash(base);
const subHash = Ens.namehash(sub);
const deepHash = Ens.namehash(deep);

console.log(
	`    ${base.padEnd(24)} → ${Hex.fromBytes(baseHash).slice(0, 18)}...`,
);
console.log(
	`    ${sub.padEnd(24)} → ${Hex.fromBytes(subHash).slice(0, 18)}...`,
);
console.log(
	`    ${deep.padEnd(24)} → ${Hex.fromBytes(deepHash).slice(0, 18)}...`,
);

// Case sensitivity check (should be normalized first)
console.log("\n7. Case Sensitivity:");
const lowercase = Ens.namehash("vitalik.eth");
const uppercase = Ens.namehash("VITALIK.eth");

console.log(`  vitalik.eth  → ${Hex.fromBytes(lowercase).slice(0, 18)}...`);
console.log(`  VITALIK.eth  → ${Hex.fromBytes(uppercase).slice(0, 18)}...`);
console.log(
	`  Match: ${Hex.fromBytes(lowercase) === Hex.fromBytes(uppercase)}`,
);
console.log("  Note: Always normalize before hashing for consistent results!");
