/**
 * Benchmark: Validation Functions
 *
 * Tests assertion performance for integer ranges and bounds checking
 */

import { bench, run } from "mitata";
import {
	assertNonNegative,
	assertNonZero,
	assertPositive,
} from "./assertCommon.js";
import { assertInRange, assertInRangeBigInt } from "./assertInRange.js";
import {
	assertInt8,
	assertInt16,
	assertInt32,
	assertInt64,
	assertInt128,
	assertInt256,
} from "./assertInt.js";
import { assertMaxSize, assertMinSize, assertSize } from "./assertSize.js";
import {
	assertUint8,
	assertUint16,
	assertUint32,
	assertUint64,
	assertUint128,
	assertUint256,
} from "./assertUint.js";

// ============================================================================
// Test Data
// ============================================================================

const validUint8 = 127;
const validUint16 = 32000;
const validUint32 = 2000000000;
const validUint64 = 1000000000000n;
const validUint128 = 10000000000000000000000n;
const validUint256 = 100000000000000000000000000000000n;

const validInt8 = -50;
const validInt16 = -15000;
const validInt32 = -1000000000;
const validInt64 = -500000000000n;
const validInt128 = -5000000000000000000000n;
const validInt256 = -50000000000000000000000000000000n;

const validBytes20 = new Uint8Array(20).fill(0xab);
const validBytes32 = new Uint8Array(32).fill(0xcd);
const validHex20 = `0x${"ab".repeat(20)}`;

// ============================================================================
// Range Assertions - Number
// ============================================================================

bench("assertInRange - valid (number)", () => {
	assertInRange(50, 0, 100, "test");
});

bench("assertInRange - at min (number)", () => {
	assertInRange(0, 0, 100, "test");
});

bench("assertInRange - at max (number)", () => {
	assertInRange(100, 0, 100, "test");
});

await run();

// ============================================================================
// Range Assertions - BigInt
// ============================================================================

bench("assertInRangeBigInt - valid", () => {
	assertInRangeBigInt(50n, 0n, 100n, "test");
});

bench("assertInRangeBigInt - large values", () => {
	assertInRangeBigInt(validUint256, 0n, 2n ** 256n - 1n, "uint256");
});

await run();

// ============================================================================
// Unsigned Integer Assertions
// ============================================================================

bench("assertUint8 - valid", () => {
	assertUint8(validUint8);
});

bench("assertUint16 - valid", () => {
	assertUint16(validUint16);
});

bench("assertUint32 - valid", () => {
	assertUint32(validUint32);
});

bench("assertUint64 - valid", () => {
	assertUint64(validUint64);
});

bench("assertUint128 - valid", () => {
	assertUint128(validUint128);
});

bench("assertUint256 - valid", () => {
	assertUint256(validUint256);
});

await run();

// ============================================================================
// Signed Integer Assertions
// ============================================================================

bench("assertInt8 - valid", () => {
	assertInt8(validInt8);
});

bench("assertInt16 - valid", () => {
	assertInt16(validInt16);
});

bench("assertInt32 - valid", () => {
	assertInt32(validInt32);
});

bench("assertInt64 - valid", () => {
	assertInt64(validInt64);
});

bench("assertInt128 - valid", () => {
	assertInt128(validInt128);
});

bench("assertInt256 - valid", () => {
	assertInt256(validInt256);
});

await run();

// ============================================================================
// Size Assertions
// ============================================================================

bench("assertSize - Uint8Array 20B", () => {
	assertSize(validBytes20, 20, "address");
});

bench("assertSize - Uint8Array 32B", () => {
	assertSize(validBytes32, 32, "hash");
});

bench("assertSize - hex string 20B", () => {
	assertSize(validHex20, 20, "address");
});

bench("assertMaxSize - 32B limit", () => {
	assertMaxSize(validBytes20, 32, "data");
});

bench("assertMinSize - 16B minimum", () => {
	assertMinSize(validBytes20, 16, "data");
});

await run();

// ============================================================================
// Common Assertions
// ============================================================================

bench("assertPositive - number", () => {
	assertPositive(100, "gasLimit");
});

bench("assertPositive - bigint", () => {
	assertPositive(100n, "amount");
});

bench("assertNonNegative - number", () => {
	assertNonNegative(0, "nonce");
});

bench("assertNonNegative - bigint", () => {
	assertNonNegative(0n, "balance");
});

bench("assertNonZero - number", () => {
	assertNonZero(1, "chainId");
});

bench("assertNonZero - bigint", () => {
	assertNonZero(1n, "chainId");
});

await run();

// ============================================================================
// Batch Validation (realistic usage)
// ============================================================================

bench("validate tx params - batch", () => {
	assertUint64(21000n); // gasLimit
	assertUint256(1000000000n); // maxFeePerGas
	assertUint256(100000000n); // maxPriorityFeePerGas
	assertUint64(0n); // nonce
	assertUint256(1000000000000000000n); // value
});

bench("validate block params - batch", () => {
	assertUint64(15000000n); // gasUsed
	assertUint64(30000000n); // gasLimit
	assertUint256(1000000000n); // baseFee
	assertUint64(12345n); // blockNumber
	assertUint64(1700000000n); // timestamp
});

await run();
