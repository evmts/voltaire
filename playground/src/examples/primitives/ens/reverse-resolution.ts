import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: ENS reverse resolution - address to name lookup

// Reverse resolution allows looking up the ENS name for an address.
// It uses the special "addr.reverse" domain structure:
// <address-without-0x>.addr.reverse

console.log("\n===== ENS Reverse Resolution =====");

// Standard reverse resolution format
console.log("\n1. Standard Reverse Resolution Format:");
console.log("  Format: <address-without-0x>.addr.reverse");
console.log("  Example: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("           ↓");
console.log("           742d35cc6634c0532925a3b844bc454e4438f44e.addr.reverse");

// Build reverse resolution names
console.log("\n2. Building Reverse Resolution Names:");
const addresses = [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	"0x5aAed5930B9EbCd462DDbaeFA21DA7F3F30FBD00",
];

for (const addr of addresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2); // Remove "0x"
	const reverseName = `${withoutPrefix}.addr.reverse`;

	console.log(`\n  Address: ${addr}`);
	console.log(`    Reverse: ${reverseName}`);
	console.log(`    Normalized: ${Ens.normalize(reverseName)}`);
}

// Reverse resolution namehashes
console.log("\n3. Reverse Resolution Namehashes:");
const exampleAddresses = [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
];

for (const addr of exampleAddresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2);
	const reverseName = `${withoutPrefix}.addr.reverse`;
	const normalizedReverse = Ens.normalize(reverseName);
	const hash = Ens.namehash(normalizedReverse);

	console.log(`\n  Address: ${normalized}`);
	console.log(`    Reverse name: ${reverseName}`);
	console.log(`    Namehash: ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Reverse resolution hierarchy
console.log("\n4. Reverse Resolution Hierarchy:");
const hierarchyExample = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const hierarchyNormalized = hierarchyExample.toLowerCase();
const hierarchyWithoutPrefix = hierarchyNormalized.slice(2);

const hierarchy = [
	"reverse",
	"addr.reverse",
	`${hierarchyWithoutPrefix}.addr.reverse`,
];

console.log("\n  Hierarchical structure:");
for (const name of hierarchy) {
	const normalizedName = Ens.normalize(name);
	const hash = Ens.namehash(normalizedName);
	const depth = name.split(".").length - 1;
	const indent = "  ".repeat(depth);
	console.log(`${indent}${name}`);
	console.log(`${indent}  → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// System domains for reverse resolution
console.log("\n5. System Domains:");
const systemDomains = [
	{ name: "reverse", desc: "Root of reverse resolution" },
	{ name: "addr.reverse", desc: "Address reverse resolution namespace" },
];

for (const { name, desc } of systemDomains) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(`\n  ${name}`);
	console.log(`    ${desc}`);
	console.log(`    Namehash: ${Hex.fromBytes(hash)}`);
}

// Multiple addresses
console.log("\n6. Multiple Address Reverse Lookups:");
const multipleAddresses = [
	"0x0000000000000000000000000000000000000000",
	"0x0000000000000000000000000000000000000001",
	"0xffffffffffffffffffffffffffffffffffffffff",
];

for (const addr of multipleAddresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2);
	const reverseName = `${withoutPrefix}.addr.reverse`;
	const hash = Ens.namehash(Ens.normalize(reverseName));

	console.log(`  ${normalized.slice(0, 12)}...${normalized.slice(-6)} → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Case sensitivity in reverse resolution
console.log("\n7. Case Sensitivity:");
const testAddr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

// Uppercase hex
const upperHex = testAddr.toUpperCase();
const upperReverse = `${upperHex.slice(2)}.addr.reverse`;
const upperNormalized = Ens.normalize(upperReverse.toLowerCase()); // Must lowercase address part
const upperHash = Ens.namehash(upperNormalized);

// Lowercase hex
const lowerHex = testAddr.toLowerCase();
const lowerReverse = `${lowerHex.slice(2)}.addr.reverse`;
const lowerNormalized = Ens.normalize(lowerReverse);
const lowerHash = Ens.namehash(lowerNormalized);

console.log(`\n  Original: ${testAddr}`);
console.log(`  Uppercase: ${upperReverse.slice(0, 20)}...`);
console.log(`    Namehash: ${Hex.fromBytes(upperHash).slice(0, 18)}...`);
console.log(`  Lowercase: ${lowerReverse.slice(0, 20)}...`);
console.log(`    Namehash: ${Hex.fromBytes(lowerHash).slice(0, 18)}...`);
console.log(`  Hashes match: ${Hex.fromBytes(upperHash) === Hex.fromBytes(lowerHash)}`);
console.log(`\n  Note: Address part must be lowercase for consistent hashing!`);
