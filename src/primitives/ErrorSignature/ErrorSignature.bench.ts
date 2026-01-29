/**
 * ErrorSignature Benchmarks: Voltaire TS vs WASM
 *
 * Compares performance of error signature operations.
 * ErrorSignature is the first 4 bytes of keccak256 hash (same as function selector).
 */

import { bench, run } from "mitata";
import * as ErrorSignature from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Standard Solidity errors
const ERROR_SIG = "Error(string)";
const PANIC_SIG = "Panic(uint256)";

// Common custom errors
const INSUFFICIENT_BALANCE_SIG = "InsufficientBalance(address,uint256,uint256)";
const UNAUTHORIZED_SIG = "Unauthorized(address)";
const INVALID_AMOUNT_SIG = "InvalidAmount(uint256)";
const EXPIRED_SIG = "Expired(uint256,uint256)";
const SLIPPAGE_SIG = "SlippageExceeded(uint256,uint256)";

// Complex errors
const TRANSFER_FAILED_SIG = "TransferFailed(address,address,uint256,bytes)";
const VALIDATION_ERROR_SIG = "ValidationError(uint8,string,bytes32)";

// Pre-computed selectors
const ERROR_SELECTOR = "0x08c379a0";
const PANIC_SELECTOR = "0x4e487b71";

// Pre-created signatures
const errorSig = ErrorSignature.fromSignature(ERROR_SIG);
const panicSig = ErrorSignature.fromSignature(PANIC_SIG);
const errorSig2 = ErrorSignature.fromSignature(ERROR_SIG);

// ============================================================================
// fromSignature benchmarks (hash computation + truncate)
// ============================================================================

bench("fromSignature - Error(string) - voltaire", () => {
	ErrorSignature.fromSignature(ERROR_SIG);
});

bench("fromSignature - Panic(uint256) - voltaire", () => {
	ErrorSignature.fromSignature(PANIC_SIG);
});

bench("fromSignature - InsufficientBalance - voltaire", () => {
	ErrorSignature.fromSignature(INSUFFICIENT_BALANCE_SIG);
});

bench("fromSignature - Unauthorized - voltaire", () => {
	ErrorSignature.fromSignature(UNAUTHORIZED_SIG);
});

await run();

bench("fromSignature - SlippageExceeded - voltaire", () => {
	ErrorSignature.fromSignature(SLIPPAGE_SIG);
});

bench("fromSignature - TransferFailed - voltaire", () => {
	ErrorSignature.fromSignature(TRANSFER_FAILED_SIG);
});

bench("fromSignature - ValidationError - voltaire", () => {
	ErrorSignature.fromSignature(VALIDATION_ERROR_SIG);
});

await run();

// ============================================================================
// fromHex benchmarks
// ============================================================================

bench("fromHex - Error selector - voltaire", () => {
	ErrorSignature.fromHex(ERROR_SELECTOR);
});

bench("fromHex - Panic selector - voltaire", () => {
	ErrorSignature.fromHex(PANIC_SELECTOR);
});

await run();

// ============================================================================
// toHex benchmarks
// ============================================================================

bench("toHex - voltaire", () => {
	ErrorSignature.toHex(errorSig);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

bench("equals - same signature - voltaire", () => {
	ErrorSignature.equals(errorSig, errorSig2);
});

bench("equals - different signatures - voltaire", () => {
	ErrorSignature.equals(errorSig, panicSig);
});

await run();

// ============================================================================
// from benchmarks (generic constructor)
// ============================================================================

bench("from - string signature - voltaire", () => {
	ErrorSignature.from(ERROR_SIG);
});

bench("from - hex selector - voltaire", () => {
	ErrorSignature.from(ERROR_SELECTOR);
});

bench("from - Uint8Array - voltaire", () => {
	ErrorSignature.from(errorSig);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const signatures = [
	ERROR_SIG,
	PANIC_SIG,
	INSUFFICIENT_BALANCE_SIG,
	UNAUTHORIZED_SIG,
	INVALID_AMOUNT_SIG,
	EXPIRED_SIG,
	SLIPPAGE_SIG,
	TRANSFER_FAILED_SIG,
];

bench("fromSignature - 8 errors batch - voltaire", () => {
	for (const sig of signatures) {
		ErrorSignature.fromSignature(sig);
	}
});

await run();

const createdSigs = signatures.map((s) => ErrorSignature.fromSignature(s));

bench("toHex - 8 errors batch - voltaire", () => {
	for (const sig of createdSigs) {
		ErrorSignature.toHex(sig);
	}
});

await run();
