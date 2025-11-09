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
	type BrandedAddress,
	compare,
	equals,
	from,
	fromHex,
	fromNumber,
	greaterThan,
	is,
	isValid,
	isZero,
	lessThan,
	toHex,
} from "../../../src/primitives/Address/BrandedAddress/index.js";

// Create addresses using functional constructors
const addr1 = from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const addr2 = fromHex("0x0000000000000000000000000000000000000045");
const addr3 = fromNumber(42n);

const addresses: BrandedAddress[] = [
	fromNumber(100n),
	fromNumber(50n),
	fromNumber(75n),
	fromNumber(0n),
	fromNumber(200n),
];

// Filter non-zero addresses
const nonZero = addresses.filter((addr) => !isZero(addr));

// Find addresses less than threshold
const threshold = fromNumber(80n);
const belowThreshold = addresses.filter((addr) => lessThan(addr, threshold));
belowThreshold.forEach((addr) => {
});

// Find addresses greater than threshold
const aboveThreshold = addresses.filter((addr) => greaterThan(addr, threshold));
aboveThreshold.forEach((addr) => {
});

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

const addrA = fromNumber(100n);
const addrB = fromNumber(200n);

const unsorted = [
	fromNumber(300n),
	fromNumber(100n),
	fromNumber(200n),
	fromNumber(50n),
];
unsorted.forEach((addr) => );

// Sort using compare function
const sorted = [...unsorted].sort(compare);
sorted.forEach((addr) => );

// Sort descending
const descending = [...unsorted].sort((a, b) => compare(b, a));
descending.forEach((addr) => );

const rawAddresses = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
	"0x0000000000000000000000000000000000000000",
	"0x0000000000000000000000000000000000000045",
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", // duplicate
	"invalid",
];
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
processed.forEach((addr) => {
});
