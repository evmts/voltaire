/**
 * Type Safety Example
 *
 * Demonstrates:
 * - Using Sized<N> type for compile-time safety
 * - Type guards with isSized
 * - Size assertions with assertSize
 * - Common Ethereum type aliases
 * - Type-safe function parameters
 */

import { Hex } from "@tevm/voltaire";
import type { BrandedHex, Sized } from "@tevm/voltaire/BrandedHex";

// Define type aliases
type Hash = Sized<32>;
type Address = Sized<20>;
type Selector = Sized<4>;
type U256 = Sized<32>;
type Signature = Sized<65>;

// Create and assert sizes
const hash: Hash = Hex.assertSize(Hex.random(32), 32);
const address: Address = Hex.assertSize(
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	20,
);
const selector: Selector = Hex.assertSize(Hex("0xa9059cbb"), 4);

function processHash(hash: Hash): void {}

function processAddress(address: Address): void {}

function processSelector(selector: Selector): void {}

processHash(hash);
processAddress(address);
processSelector(selector);

function classifyValue(value: BrandedHex): string {
	if (Hex.isSized(value, 32)) {
		// TypeScript knows value is Sized<32>
		return `Hash or U256: ${value}`;
	}
	if (Hex.isSized(value, 20)) {
		// TypeScript knows value is Sized<20>
		return `Address: ${value}`;
	}
	if (Hex.isSized(value, 4)) {
		// TypeScript knows value is Sized<4>
		return `Selector: ${value}`;
	}
	return `Other (${Hex.size(value)} bytes): ${value}`;
}

const values = [Hex.random(32), Hex.random(20), Hex.random(4), Hex.random(8)];

values.forEach((v) => {});

function createHash(value: BrandedHex): Hash {
	// Assert and return typed value
	return Hex.assertSize(value, 32);
}

function createAddress(value: BrandedHex): Address {
	return Hex.assertSize(value, 20);
}

try {
	const myHash = createHash(Hex.random(32));

	const myAddress = createAddress(
		Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	);

	// This would throw
	// const wrongHash = createHash(Hex.random(20))
} catch (e) {}

function toFixedBytes<N extends number>(value: bigint, size: N): Sized<N> {
	return Hex.assertSize(Hex.fromBigInt(value, size), size);
}

const hash32 = toFixedBytes(0n, 32); // Sized<32>
const addr20 = toFixedBytes(0n, 20); // Sized<20>
const selector4 = toFixedBytes(0xa9059cbbn, 4); // Sized<4>

type EthValue =
	| { type: "hash"; value: Hash }
	| { type: "address"; value: Address }
	| { type: "selector"; value: Selector }
	| { type: "unknown"; value: BrandedHex };

function classify(hex: BrandedHex): EthValue {
	const size = Hex.size(hex);

	if (size === 32) {
		return { type: "hash", value: Hex.assertSize(hex, 32) };
	}
	if (size === 20) {
		return { type: "address", value: Hex.assertSize(hex, 20) };
	}
	if (size === 4) {
		return { type: "selector", value: Hex.assertSize(hex, 4) };
	}
	return { type: "unknown", value: hex };
}

function handleValue(classified: EthValue): void {
	switch (classified.type) {
		case "hash":
			break;
		case "address":
			break;
		case "selector":
			break;
		case "unknown":
			break;
	}
}

const testValues = [
	Hex.random(32),
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Hex("0xa9059cbb"),
	Hex.random(8),
];

testValues.forEach((v) => handleValue(classify(v)));

const hashes: Hash[] = [
	Hex.assertSize(Hex.random(32), 32),
	Hex.assertSize(Hex.random(32), 32),
	Hex.assertSize(Hex.random(32), 32),
];
hashes.forEach((h, i) => {});

const addresses: Address[] = [
	Hex.assertSize(Hex.random(20), 20),
	Hex.assertSize(Hex.random(20), 20),
];
addresses.forEach((a, i) => {});

function hexToAddress(hex: BrandedHex): Address | null {
	if (!Hex.isSized(hex, 20)) {
		return null;
	}
	return hex; // TypeScript knows it's Sized<20>
}

function hexToHash(hex: BrandedHex): Hash | null {
	if (!Hex.isSized(hex, 32)) {
		return null;
	}
	return hex; // TypeScript knows it's Sized<32>
}

const testHex1 = Hex.random(20);
const testHex2 = Hex.random(32);
const testHex3 = Hex.random(8);

const addr1 = hexToAddress(testHex1);
const addr2 = hexToAddress(testHex2);
const addr3 = hexToAddress(testHex3);

const hash1 = hexToHash(testHex1);
const hash2 = hexToHash(testHex2);

const HASH_SIZE = 32;
const ADDRESS_SIZE = 20;
const SELECTOR_SIZE = 4;
const U256_SIZE = 32;
const SIGNATURE_SIZE = 65;

// Use in validation
function validateHash(hex: BrandedHex): Hash {
	return Hex.assertSize(hex, HASH_SIZE);
}

function validateAddress(hex: BrandedHex): Address {
	return Hex.assertSize(hex, ADDRESS_SIZE);
}

const validHash = validateHash(Hex.random(32));
const validAddr = validateAddress(Hex.random(20));

const ZERO_HASH: Hash = Hex.assertSize(Hex.zero(32), 32);
const ZERO_ADDRESS: Address = Hex.assertSize(Hex.zero(20), 20);

function isZeroHash(hash: Hash): boolean {
	return Hex.equals(hash, ZERO_HASH);
}

function isZeroAddress(address: Address): boolean {
	return Hex.equals(address, ZERO_ADDRESS);
}

const someHash = Hex.assertSize(Hex.random(32), 32);
const someAddr = Hex.assertSize(Hex.random(20), 20);
