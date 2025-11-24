import * as Ens from "../../../primitives/Ens/index.js";

// Example: ENS name normalization per ENSIP-15

console.log("\n===== ENS Name Normalization =====");

// Normalization converts names to canonical lowercase form
// This ensures consistent hashing and lookups

// Basic normalization
const examples = [
	"VITALIK.eth",
	"Nick.ETH",
	"CamelCase.eth",
	"UPPERCASE.eth",
	"MixedCase.ETH",
];

console.log("\nBasic normalization:");
for (const name of examples) {
	const normalized = Ens.normalize(name);
	console.log(`  ${name.padEnd(20)} → ${normalized}`);
}

// Subdomain normalization
console.log("\nSubdomain normalization:");
const subdomains = ["Sub.Domain.eth", "DEEP.SUB.DOMAIN.eth", "My.Name.eth"];

for (const name of subdomains) {
	const normalized = Ens.normalize(name);
	console.log(`  ${name.padEnd(24)} → ${normalized}`);
}

// Already normalized names remain unchanged
console.log("\nAlready normalized (idempotent):");
const alreadyNormalized = ["vitalik.eth", "nick.eth", "lowercase.eth"];

for (const name of alreadyNormalized) {
	const normalized = Ens.normalize(name);
	const matches = name === normalized;
	console.log(
		`  ${name.padEnd(20)} → ${normalized} (${matches ? "unchanged" : "changed"})`,
	);
}

// Error handling for invalid characters
console.log("\nError handling:");
try {
	Ens.normalize("invalid\x00.eth"); // Contains null byte
	console.log("  ❌ Should have thrown error");
} catch (error) {
	console.log(
		"  ✓ Rejected invalid characters:",
		(error as Error).message.split("\n")[0],
	);
}

// Emoji and special characters
console.log("\nSpecial characters:");
try {
	const emoji = Ens.normalize("💩.eth");
	console.log(`  💩.eth → ${emoji}`);
} catch (error) {
	console.log("  💩.eth → [error]", (error as Error).message.split("\n")[0]);
}
