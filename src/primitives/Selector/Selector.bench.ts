/**
 * Selector Performance Benchmarks - SLICE 2
 *
 * Benchmarks for function selector operations:
 * - voltaire (default JS)
 * - voltaire-effect
 * - viem (reference)
 * - ethers (reference)
 */

import { bench, run } from "mitata";
import * as Selector from "./index.js";

// viem comparison
import { toFunctionSelector } from "viem";

// ethers comparison
import { id as ethersId } from "ethers";

// ============================================================================
// Test Data
// ============================================================================

// Common function signatures
const TRANSFER_SIG = "transfer(address,uint256)";
const APPROVE_SIG = "approve(address,uint256)";
const BALANCE_OF_SIG = "balanceOf(address)";
const COMPLEX_SIG = "multicall((address,bytes)[],uint256,bytes32)";

// Pre-computed selectors (4 bytes)
const TRANSFER_SELECTOR = "0xa9059cbb";
const APPROVE_SELECTOR = "0x095ea7b3";

// Pre-created instances
const voltaireSelector = Selector.from(TRANSFER_SELECTOR);

// ============================================================================
// Construction: from (hex string)
// ============================================================================

bench("Selector.from(hex) - voltaire", () => {
	Selector.from(TRANSFER_SELECTOR);
});

await run();

// ============================================================================
// Construction: fromHex
// ============================================================================

bench("Selector.fromHex - voltaire", () => {
	Selector.fromHex(TRANSFER_SELECTOR);
});

await run();

// ============================================================================
// Construction: fromSignature (keccak256 + slice)
// ============================================================================

bench("Selector.fromSignature - transfer - voltaire", () => {
	Selector.fromSignature(TRANSFER_SIG);
});

bench("toFunctionSelector - transfer - viem", () => {
	toFunctionSelector(TRANSFER_SIG);
});

bench("id(sig).slice(0,10) - transfer - ethers", () => {
	ethersId(TRANSFER_SIG).slice(0, 10);
});

await run();

bench("Selector.fromSignature - approve - voltaire", () => {
	Selector.fromSignature(APPROVE_SIG);
});

bench("toFunctionSelector - approve - viem", () => {
	toFunctionSelector(APPROVE_SIG);
});

bench("id(sig).slice(0,10) - approve - ethers", () => {
	ethersId(APPROVE_SIG).slice(0, 10);
});

await run();

bench("Selector.fromSignature - balanceOf - voltaire", () => {
	Selector.fromSignature(BALANCE_OF_SIG);
});

bench("toFunctionSelector - balanceOf - viem", () => {
	toFunctionSelector(BALANCE_OF_SIG);
});

bench("id(sig).slice(0,10) - balanceOf - ethers", () => {
	ethersId(BALANCE_OF_SIG).slice(0, 10);
});

await run();

bench("Selector.fromSignature - complex - voltaire", () => {
	Selector.fromSignature(COMPLEX_SIG);
});

bench("toFunctionSelector - complex - viem", () => {
	toFunctionSelector(COMPLEX_SIG);
});

bench("id(sig).slice(0,10) - complex - ethers", () => {
	ethersId(COMPLEX_SIG).slice(0, 10);
});

await run();

// ============================================================================
// Conversion: toHex
// ============================================================================

bench("Selector.toHex - voltaire", () => {
	Selector.toHex(voltaireSelector);
});

await run();

// ============================================================================
// Comparison: equals
// ============================================================================

const selector1 = Selector.from(TRANSFER_SELECTOR);
const selector2 = Selector.from(TRANSFER_SELECTOR);
const selector3 = Selector.from(APPROVE_SELECTOR);

bench("Selector.equals - same - voltaire", () => {
	Selector.equals(selector1, selector2);
});

bench("Selector.equals - different - voltaire", () => {
	Selector.equals(selector1, selector3);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const signatures = [
	"transfer(address,uint256)",
	"approve(address,uint256)",
	"balanceOf(address)",
	"transferFrom(address,address,uint256)",
	"allowance(address,address)",
	"totalSupply()",
	"name()",
	"symbol()",
	"decimals()",
	"mint(address,uint256)",
];

bench("Batch fromSignature (10 sigs) - voltaire", () => {
	for (const sig of signatures) {
		Selector.fromSignature(sig);
	}
});

bench("Batch toFunctionSelector (10 sigs) - viem", () => {
	for (const sig of signatures) {
		toFunctionSelector(sig);
	}
});

bench("Batch id().slice() (10 sigs) - ethers", () => {
	for (const sig of signatures) {
		ethersId(sig).slice(0, 10);
	}
});

await run();

// ============================================================================
// Round-trip: signature -> selector -> hex
// ============================================================================

bench("roundtrip sig->selector->hex - voltaire", () => {
	const selector = Selector.fromSignature(TRANSFER_SIG);
	Selector.toHex(selector);
});

await run();
