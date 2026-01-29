/**
 * FunctionSignature Benchmarks: Voltaire TS vs WASM
 *
 * Compares performance of function signature operations.
 * FunctionSignature is the first 4 bytes of keccak256 hash.
 */

import { bench, run } from "mitata";
import * as FunctionSignature from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Common ERC20 functions
const TRANSFER_SIG = "transfer(address,uint256)";
const TRANSFER_FROM_SIG = "transferFrom(address,address,uint256)";
const APPROVE_SIG = "approve(address,uint256)";
const BALANCE_OF_SIG = "balanceOf(address)";
const ALLOWANCE_SIG = "allowance(address,address)";

// Complex function signatures
const MULTICALL_SIG = "multicall(bytes[])";
const SWAP_SIG =
	"swap(uint256,uint256,address,bytes)";
const PERMIT_SIG =
	"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)";

// Pre-computed selectors for from benchmarks
const TRANSFER_SELECTOR = "0xa9059cbb";
const APPROVE_SELECTOR = "0x095ea7b3";

// Pre-created signatures
const transferSig = FunctionSignature.fromSignature(TRANSFER_SIG);
const approveSig = FunctionSignature.fromSignature(APPROVE_SIG);
const transferSig2 = FunctionSignature.fromSignature(TRANSFER_SIG);

// ============================================================================
// fromSignature benchmarks (hash computation + truncate)
// ============================================================================

bench("fromSignature - transfer - voltaire", () => {
	FunctionSignature.fromSignature(TRANSFER_SIG);
});

bench("fromSignature - transferFrom - voltaire", () => {
	FunctionSignature.fromSignature(TRANSFER_FROM_SIG);
});

bench("fromSignature - approve - voltaire", () => {
	FunctionSignature.fromSignature(APPROVE_SIG);
});

bench("fromSignature - balanceOf - voltaire", () => {
	FunctionSignature.fromSignature(BALANCE_OF_SIG);
});

await run();

bench("fromSignature - multicall - voltaire", () => {
	FunctionSignature.fromSignature(MULTICALL_SIG);
});

bench("fromSignature - swap (complex) - voltaire", () => {
	FunctionSignature.fromSignature(SWAP_SIG);
});

bench("fromSignature - permit (7 params) - voltaire", () => {
	FunctionSignature.fromSignature(PERMIT_SIG);
});

await run();

// ============================================================================
// parseSignature benchmarks (extract name and inputs)
// ============================================================================

bench("parseSignature - transfer - voltaire", () => {
	FunctionSignature.parseSignature(TRANSFER_SIG);
});

bench("parseSignature - transferFrom - voltaire", () => {
	FunctionSignature.parseSignature(TRANSFER_FROM_SIG);
});

bench("parseSignature - permit (7 params) - voltaire", () => {
	FunctionSignature.parseSignature(PERMIT_SIG);
});

await run();

// ============================================================================
// toHex benchmarks
// ============================================================================

bench("toHex - voltaire", () => {
	FunctionSignature.toHex(transferSig);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

bench("equals - same signature - voltaire", () => {
	FunctionSignature.equals(transferSig, transferSig2);
});

bench("equals - different signatures - voltaire", () => {
	FunctionSignature.equals(transferSig, approveSig);
});

await run();

// ============================================================================
// from benchmarks (generic constructor)
// ============================================================================

bench("from - string signature - voltaire", () => {
	FunctionSignature.from(TRANSFER_SIG);
});

bench("from - hex selector - voltaire", () => {
	FunctionSignature.from(TRANSFER_SELECTOR);
});

bench("from - Uint8Array - voltaire", () => {
	FunctionSignature.from(transferSig);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const signatures = [
	TRANSFER_SIG,
	TRANSFER_FROM_SIG,
	APPROVE_SIG,
	BALANCE_OF_SIG,
	ALLOWANCE_SIG,
	MULTICALL_SIG,
	SWAP_SIG,
	PERMIT_SIG,
];

bench("fromSignature - 8 functions batch - voltaire", () => {
	for (const sig of signatures) {
		FunctionSignature.fromSignature(sig);
	}
});

await run();

const createdSigs = signatures.map((s) => FunctionSignature.fromSignature(s));

bench("toHex - 8 functions batch - voltaire", () => {
	for (const sig of createdSigs) {
		FunctionSignature.toHex(sig);
	}
});

await run();
