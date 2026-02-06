/**
 * DomainSeparator Benchmarks - mitata format
 * EIP-712 domain separator operations
 */

import { bench, run } from "mitata";
import * as DomainSeparator from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Well-known domain separators (from popular contracts)
const usdcDomainSeparator =
	"0x06c37168a7db5138defc7866392bb87a741f9b3d104deb5094588ce041cac6c5";
const uniswapDomainSeparator =
	"0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f";
const aaveDomainSeparator =
	"0x9eb8e6b7cba7ad2c5fd028252f7e8b19e1b85b2f9f4a1e0bfc3aa0f5e1e9e9f1";

// Random domain separators
const randomSeparator1 =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const randomSeparator2 =
	"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

// Bytes versions
const usdcBytes = new Uint8Array([
	0x06, 0xc3, 0x71, 0x68, 0xa7, 0xdb, 0x51, 0x38, 0xde, 0xfc, 0x78, 0x66, 0x39,
	0x2b, 0xb8, 0x7a, 0x74, 0x1f, 0x9b, 0x3d, 0x10, 0x4d, 0xeb, 0x50, 0x94, 0x58,
	0x8c, 0xe0, 0x41, 0xca, 0xc6, 0xc5,
]);

// Pre-created instances
const usdcInstance = DomainSeparator.from(usdcDomainSeparator);
const uniswapInstance = DomainSeparator.from(uniswapDomainSeparator);
const aaveInstance = DomainSeparator.from(aaveDomainSeparator);
const randomInstance1 = DomainSeparator.from(randomSeparator1);
const randomInstance2 = DomainSeparator.from(randomSeparator2);

// ============================================================================
// DomainSeparator.from - construction
// ============================================================================

bench("DomainSeparator.from(hex) - voltaire", () => {
	DomainSeparator.from(usdcDomainSeparator);
});

bench("DomainSeparator.from(bytes) - voltaire", () => {
	DomainSeparator.from(usdcBytes);
});

await run();

// ============================================================================
// DomainSeparator.fromHex
// ============================================================================

bench("DomainSeparator.fromHex - USDC - voltaire", () => {
	DomainSeparator.fromHex(usdcDomainSeparator);
});

bench("DomainSeparator.fromHex - Uniswap - voltaire", () => {
	DomainSeparator.fromHex(uniswapDomainSeparator);
});

bench("DomainSeparator.fromHex - Aave - voltaire", () => {
	DomainSeparator.fromHex(aaveDomainSeparator);
});

await run();

// ============================================================================
// DomainSeparator.fromBytes
// ============================================================================

bench("DomainSeparator.fromBytes - voltaire", () => {
	DomainSeparator.fromBytes(usdcBytes);
});

await run();

// ============================================================================
// DomainSeparator.toHex
// ============================================================================

bench("DomainSeparator.toHex - USDC - voltaire", () => {
	DomainSeparator.toHex(usdcInstance);
});

bench("DomainSeparator.toHex - Uniswap - voltaire", () => {
	DomainSeparator.toHex(uniswapInstance);
});

await run();

// ============================================================================
// DomainSeparator.equals
// ============================================================================

bench("DomainSeparator.equals - same - voltaire", () => {
	DomainSeparator.equals(usdcInstance, usdcInstance);
});

bench("DomainSeparator.equals - different - voltaire", () => {
	DomainSeparator.equals(usdcInstance, uniswapInstance);
});

bench("DomainSeparator.equals - random - voltaire", () => {
	DomainSeparator.equals(randomInstance1, randomInstance2);
});

await run();

// ============================================================================
// Round-trip: from + toHex
// ============================================================================

bench("roundtrip (fromHex+toHex) - voltaire", () => {
	const sep = DomainSeparator.fromHex(usdcDomainSeparator);
	DomainSeparator.toHex(sep);
});

bench("roundtrip (fromBytes+toHex) - voltaire", () => {
	const sep = DomainSeparator.fromBytes(usdcBytes);
	DomainSeparator.toHex(sep);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const separators = [
	usdcDomainSeparator,
	uniswapDomainSeparator,
	aaveDomainSeparator,
	randomSeparator1,
	randomSeparator2,
];

bench("batch from(hex) - 5 separators - voltaire", () => {
	for (const sep of separators) {
		DomainSeparator.from(sep);
	}
});

bench("batch toHex - 5 separators - voltaire", () => {
	for (const inst of [
		usdcInstance,
		uniswapInstance,
		aaveInstance,
		randomInstance1,
		randomInstance2,
	]) {
		DomainSeparator.toHex(inst);
	}
});

await run();

// ============================================================================
// Comparison operations
// ============================================================================

const instances = [
	usdcInstance,
	uniswapInstance,
	aaveInstance,
	randomInstance1,
	randomInstance2,
];

bench("find matching separator - voltaire", () => {
	const target = aaveInstance;
	for (const inst of instances) {
		if (DomainSeparator.equals(inst, target)) {
			break;
		}
	}
});

await run();
