/**
 * EventSignature Benchmarks: Voltaire TS vs WASM
 *
 * Compares performance of event signature operations.
 * EventSignature is the keccak256 hash of an event signature string (32 bytes).
 */

import { bench, run } from "mitata";
import * as EventSignature from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Common ERC20/ERC721 events
const TRANSFER_SIG = "Transfer(address,address,uint256)";
const APPROVAL_SIG = "Approval(address,address,uint256)";
const APPROVAL_FOR_ALL_SIG = "ApprovalForAll(address,address,bool)";

// Complex events with multiple indexed params
const SWAP_SIG =
	"Swap(address,uint256,uint256,uint256,uint256,address)";
const DEPOSIT_SIG = "Deposit(address,uint256)";
const WITHDRAWAL_SIG = "Withdrawal(address,uint256)";

// Pre-computed hashes for fromHex benchmarks
const TRANSFER_HASH =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const APPROVAL_HASH =
	"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

// Pre-created signatures for comparison benchmarks
const transferSig = EventSignature.fromSignature(TRANSFER_SIG);
const approvalSig = EventSignature.fromSignature(APPROVAL_SIG);
const transferSig2 = EventSignature.fromSignature(TRANSFER_SIG);

// ============================================================================
// fromSignature benchmarks (hash computation)
// ============================================================================

bench("fromSignature - Transfer - voltaire", () => {
	EventSignature.fromSignature(TRANSFER_SIG);
});

bench("fromSignature - Approval - voltaire", () => {
	EventSignature.fromSignature(APPROVAL_SIG);
});

bench("fromSignature - ApprovalForAll - voltaire", () => {
	EventSignature.fromSignature(APPROVAL_FOR_ALL_SIG);
});

await run();

bench("fromSignature - Swap (complex) - voltaire", () => {
	EventSignature.fromSignature(SWAP_SIG);
});

bench("fromSignature - Deposit - voltaire", () => {
	EventSignature.fromSignature(DEPOSIT_SIG);
});

bench("fromSignature - Withdrawal - voltaire", () => {
	EventSignature.fromSignature(WITHDRAWAL_SIG);
});

await run();

// ============================================================================
// fromHex benchmarks (hex string parsing)
// ============================================================================

bench("fromHex - Transfer hash - voltaire", () => {
	EventSignature.fromHex(TRANSFER_HASH);
});

bench("fromHex - Approval hash - voltaire", () => {
	EventSignature.fromHex(APPROVAL_HASH);
});

await run();

// ============================================================================
// toHex benchmarks (hex string conversion)
// ============================================================================

bench("toHex - voltaire", () => {
	EventSignature.toHex(transferSig);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

bench("equals - same signature - voltaire", () => {
	EventSignature.equals(transferSig, transferSig2);
});

bench("equals - different signatures - voltaire", () => {
	EventSignature.equals(transferSig, approvalSig);
});

await run();

// ============================================================================
// from benchmarks (generic constructor)
// ============================================================================

bench("from - string signature - voltaire", () => {
	EventSignature.from(TRANSFER_SIG);
});

bench("from - hex string - voltaire", () => {
	EventSignature.from(TRANSFER_HASH);
});

bench("from - Uint8Array - voltaire", () => {
	EventSignature.from(transferSig);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const signatures = [
	TRANSFER_SIG,
	APPROVAL_SIG,
	APPROVAL_FOR_ALL_SIG,
	SWAP_SIG,
	DEPOSIT_SIG,
	WITHDRAWAL_SIG,
];

bench("fromSignature - 6 events batch - voltaire", () => {
	for (const sig of signatures) {
		EventSignature.fromSignature(sig);
	}
});

await run();

const createdSigs = signatures.map((s) => EventSignature.fromSignature(s));

bench("toHex - 6 events batch - voltaire", () => {
	for (const sig of createdSigs) {
		EventSignature.toHex(sig);
	}
});

await run();
