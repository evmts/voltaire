/**
 * Benchmark: ERC-7751 Wrapped Error Encoding/Decoding
 *
 * Tests encodeWrappedError and decodeWrappedError performance
 */

import { bench, run } from "mitata";
import { WRAPPED_ERROR_SELECTOR } from "./constants.js";
import { decodeWrappedError } from "./decodeWrappedError.js";
import { encodeWrappedError } from "./encodeWrappedError.js";

// ============================================================================
// Test Data
// ============================================================================

const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
const testSelector = new Uint8Array([0xab, 0xcd, 0x12, 0x34]);

// Simple error reason (just a string: "Insufficient balance")
const simpleReason = new Uint8Array([
	0x08,
	0xc3,
	0x79,
	0xa0, // Error(string) selector
	// ABI-encoded "Insufficient balance"
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x20,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x00,
	0x14,
	0x49,
	0x6e,
	0x73,
	0x75,
	0x66,
	0x66,
	0x69,
	0x63,
	0x69,
	0x65,
	0x6e,
	0x74,
	0x20,
	0x62,
	0x61,
	0x6c,
	0x61,
	0x6e,
	0x63,
	0x65,
]);

// Empty details
const emptyDetails = new Uint8Array(0);

// Some context details
const contextDetails = new Uint8Array(64).fill(0xab);

// Wrapped error objects
const simpleWrappedError = {
	target: testAddress,
	selector: testSelector,
	reason: simpleReason,
	details: emptyDetails,
};

const wrappedErrorWithDetails = {
	target: testAddress,
	selector: testSelector,
	reason: simpleReason,
	details: contextDetails,
};

// Pre-encode for decode benchmarks
const encodedSimple = encodeWrappedError(simpleWrappedError);
const encodedWithDetails = encodeWrappedError(wrappedErrorWithDetails);

// ============================================================================
// Encode Wrapped Error - Simple
// ============================================================================

bench("encodeWrappedError - simple (no details)", () => {
	encodeWrappedError(simpleWrappedError);
});

bench("encodeWrappedError - with details (64B)", () => {
	encodeWrappedError(wrappedErrorWithDetails);
});

await run();

// ============================================================================
// Encode Wrapped Error - Various Detail Sizes
// ============================================================================

const wrappedError128B = {
	target: testAddress,
	selector: testSelector,
	reason: simpleReason,
	details: new Uint8Array(128).fill(0xcd),
};

const wrappedError256B = {
	target: testAddress,
	selector: testSelector,
	reason: simpleReason,
	details: new Uint8Array(256).fill(0xef),
};

bench("encodeWrappedError - 128B details", () => {
	encodeWrappedError(wrappedError128B);
});

bench("encodeWrappedError - 256B details", () => {
	encodeWrappedError(wrappedError256B);
});

await run();

// ============================================================================
// Decode Wrapped Error
// ============================================================================

bench("decodeWrappedError - simple", () => {
	decodeWrappedError(encodedSimple);
});

bench("decodeWrappedError - with details", () => {
	decodeWrappedError(encodedWithDetails);
});

await run();

// ============================================================================
// Round-trip (Encode + Decode)
// ============================================================================

bench("round-trip - simple", () => {
	const encoded = encodeWrappedError(simpleWrappedError);
	decodeWrappedError(encoded);
});

bench("round-trip - with details", () => {
	const encoded = encodeWrappedError(wrappedErrorWithDetails);
	decodeWrappedError(encoded);
});

await run();

// ============================================================================
// Selector Check (fast path)
// ============================================================================

bench("selector check - valid", () => {
	const slice = encodedSimple.slice(0, 4);
	const _match =
		slice[0] === WRAPPED_ERROR_SELECTOR[0] &&
		slice[1] === WRAPPED_ERROR_SELECTOR[1] &&
		slice[2] === WRAPPED_ERROR_SELECTOR[2] &&
		slice[3] === WRAPPED_ERROR_SELECTOR[3];
});

bench("selector check - invalid", () => {
	const invalid = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
	const _match =
		invalid[0] === WRAPPED_ERROR_SELECTOR[0] &&
		invalid[1] === WRAPPED_ERROR_SELECTOR[1] &&
		invalid[2] === WRAPPED_ERROR_SELECTOR[2] &&
		invalid[3] === WRAPPED_ERROR_SELECTOR[3];
});

await run();
