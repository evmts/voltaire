/**
 * Tree-Shakeable API Example
 *
 * Demonstrates:
 * - Using BrandedAddress functional API for minimal bundle size
 * - Selective imports to avoid pulling in unused code
 * - Bundle optimization by avoiding keccak256/RLP dependencies
 * - Comparison of class API vs functional API
 */

import {
	from,
	fromHex,
	fromNumber,
	toHex,
	equals,
	isZero,
	compare,
	lessThan,
	greaterThan,
	isValid,
	is,
	type BrandedAddress,
} from "../../../src/primitives/Address/BrandedAddress/index.js";

console.log("=== Tree-Shakeable Address API ===\n");

// 1. Functional API basics
console.log("1. Functional API Basics\n");

// Create addresses using functional constructors
const addr1 = from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const addr2 = fromHex("0x0000000000000000000000000000000000000045");
const addr3 = fromNumber(42n);

console.log(`Address 1: ${toHex(addr1)}`);
console.log(`Address 2: ${toHex(addr2)}`);
console.log(`Address 3: ${toHex(addr3)}`);
console.log();

// 2. Data-first function style
console.log("2. Data-First Function Style\n");

// Functions take data as first parameter
console.log(`Is addr2 zero? ${isZero(addr2)}`);
console.log(`Are addr1 and addr2 equal? ${equals(addr1, addr2)}`);
console.log(`Compare addr2 to addr3: ${compare(addr2, addr3)}`);
console.log();

// 3. Bundle optimization
console.log("3. Bundle Optimization\n");

console.log("✓ Methods used in this example:");
console.log("  - from, fromHex, fromNumber (no crypto)");
console.log("  - toHex (simple conversion)");
console.log("  - equals, compare, lessThan, greaterThan (byte comparison)");
console.log("  - isValid, is, isZero (validation)");
console.log();

console.log("✗ Methods NOT imported (excluded from bundle):");
console.log("  - toChecksummed (requires keccak256)");
console.log("  - fromPublicKey (requires keccak256)");
console.log("  - fromPrivateKey (requires secp256k1 + keccak256)");
console.log("  - calculateCreateAddress (requires RLP + keccak256)");
console.log("  - calculateCreate2Address (requires keccak256)");
console.log("  - isValidChecksum (requires keccak256)");
console.log();

console.log("Bundle impact: ~50KB smaller by avoiding crypto imports!");
console.log();

// 4. Composable functional patterns
console.log("4. Composable Functional Patterns\n");

const addresses: BrandedAddress[] = [
	fromNumber(100n),
	fromNumber(50n),
	fromNumber(75n),
	fromNumber(0n),
	fromNumber(200n),
];

// Filter non-zero addresses
const nonZero = addresses.filter((addr) => !isZero(addr));
console.log(`Non-zero addresses: ${nonZero.length}/${addresses.length}`);

// Find addresses less than threshold
const threshold = fromNumber(80n);
const belowThreshold = addresses.filter((addr) => lessThan(addr, threshold));
console.log(`Below threshold (80): ${belowThreshold.length}`);
belowThreshold.forEach((addr) => {
	console.log(`  ${toHex(addr)}`);
});
console.log();

// Find addresses greater than threshold
const aboveThreshold = addresses.filter((addr) => greaterThan(addr, threshold));
console.log(`Above threshold (80): ${aboveThreshold.length}`);
aboveThreshold.forEach((addr) => {
	console.log(`  ${toHex(addr)}`);
});
console.log();

// 5. Type guards in functional style
console.log("5. Type Guards\n");

function processUnknown(value: unknown): string {
	if (is(value)) {
		// TypeScript knows value is BrandedAddress
		return toHex(value);
	}
	if (typeof value === "string" && isValid(value)) {
		// Valid hex string - convert it
		return toHex(from(value));
	}
	return "invalid";
}

console.log(`Process BrandedAddress: ${processUnknown(addr1)}`);
console.log(
	`Process hex string: ${processUnknown("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")}`,
);
console.log(`Process number: ${processUnknown(42)}`);
console.log();

// 6. Comparison operators
console.log("6. Comparison Operators\n");

const addrA = fromNumber(100n);
const addrB = fromNumber(200n);

console.log(`Address A: ${toHex(addrA)}`);
console.log(`Address B: ${toHex(addrB)}`);
console.log();

console.log(`equals(A, B): ${equals(addrA, addrB)}`);
console.log(
	`compare(A, B): ${compare(addrA, addrB)} (${compare(addrA, addrB) === -1 ? "A < B" : "invalid"})`,
);
console.log(`lessThan(A, B): ${lessThan(addrA, addrB)}`);
console.log(`greaterThan(A, B): ${greaterThan(addrA, addrB)}`);
console.log();

console.log(`equals(A, A): ${equals(addrA, addrA)}`);
console.log(`compare(A, A): ${compare(addrA, addrA)} (equal)`);
console.log();

// 7. Sorting with functional API
console.log("7. Sorting with Functional API\n");

const unsorted = [
	fromNumber(300n),
	fromNumber(100n),
	fromNumber(200n),
	fromNumber(50n),
];

console.log("Before sorting:");
unsorted.forEach((addr) => console.log(`  ${toHex(addr)}`));

// Sort using compare function
const sorted = [...unsorted].sort(compare);

console.log("\nAfter sorting (ascending):");
sorted.forEach((addr) => console.log(`  ${toHex(addr)}`));

// Sort descending
const descending = [...unsorted].sort((a, b) => compare(b, a));

console.log("\nAfter sorting (descending):");
descending.forEach((addr) => console.log(`  ${toHex(addr)}`));
console.log();

// 8. Chaining functional operations
console.log("8. Chaining Functional Operations\n");

const rawAddresses = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
	"0x0000000000000000000000000000000000000000",
	"0x0000000000000000000000000000000000000045",
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", // duplicate
	"invalid",
];

console.log("Processing raw inputs:");
const processed = rawAddresses
	// Validate and convert
	.filter((str) => typeof str === "string" && isValid(str))
	.map((str) => from(str))
	// Remove zeros
	.filter((addr) => !isZero(addr))
	// Remove duplicates
	.filter((addr, i, arr) => arr.findIndex((a) => equals(a, addr)) === i)
	// Sort
	.sort(compare);

console.log(`Valid: ${rawAddresses.length} → ${processed.length}`);
processed.forEach((addr) => {
	console.log(`  ${toHex(addr)}`);
});
console.log();

// 9. Performance considerations
console.log("9. Performance Considerations\n");

console.log("Functional API benefits:");
console.log("✓ Tree-shaking eliminates unused code");
console.log("✓ No prototype chain overhead");
console.log("✓ Direct function calls (no method lookup)");
console.log("✓ Easier to optimize by bundlers");
console.log("✓ Works in any JavaScript environment");
console.log();

console.log("Class API benefits:");
console.log("✓ Familiar OOP style");
console.log("✓ Method chaining");
console.log("✓ Inherits Uint8Array methods");
console.log("✓ IDE autocomplete on instances");
console.log();

// 10. When to use functional API
console.log("10. When to Use Functional API\n");

console.log("Use functional API when:");
console.log("✓ Bundle size is critical (mobile/embedded)");
console.log("✓ You only need basic operations (no crypto)");
console.log("✓ Building libraries with tree-shaking");
console.log("✓ Composing with other functional code");
console.log();

console.log("Use class API when:");
console.log("✓ Developer experience is priority");
console.log("✓ Using full Address features anyway");
console.log("✓ Method chaining feels more natural");
console.log("✓ Working in OOP-heavy codebase");
