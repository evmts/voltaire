/**
 * Benchmark: BuilderBid (MEV-Boost) operations
 * Tests builder bid parsing and value extraction
 */

import { bench, run } from "mitata";
import * as BuilderBid from "./index.js";

// Test data - realistic builder bid
const parentHash = "0x" + "ab".repeat(32);
const blockHash = "0x" + "cd".repeat(32);
const builderPubkey = "0x" + "11".repeat(48);
const proposerPubkey = "0x" + "22".repeat(48);
const proposerFeeRecipient = "0x" + "33".repeat(20);
const signature = "0x" + "44".repeat(96);

const bidInputHex = {
	slot: 1000000n,
	parentHash,
	blockHash,
	builderPubkey,
	proposerPubkey,
	proposerFeeRecipient,
	gasLimit: 30000000n,
	gasUsed: 25000000n,
	value: 1000000000000000000n, // 1 ETH
	signature,
};

const bidInputBytes = {
	slot: 1000000n,
	parentHash: new Uint8Array(32).fill(0xab),
	blockHash: new Uint8Array(32).fill(0xcd),
	builderPubkey: new Uint8Array(48).fill(0x11),
	proposerPubkey: new Uint8Array(48).fill(0x22),
	proposerFeeRecipient: new Uint8Array(20).fill(0x33),
	gasLimit: 30000000n,
	gasUsed: 25000000n,
	value: 1000000000000000000n,
	signature: new Uint8Array(96).fill(0x44),
};

// Pre-created bid for other operations
const bid = BuilderBid.from(bidInputBytes);

// ============================================================================
// from (constructor with hex strings)
// ============================================================================

bench("BuilderBid.from - hex strings - voltaire", () => {
	BuilderBid.from(bidInputHex);
});

await run();

// ============================================================================
// from (constructor with bytes)
// ============================================================================

bench("BuilderBid.from - Uint8Array - voltaire", () => {
	BuilderBid.from(bidInputBytes);
});

await run();

// ============================================================================
// getValue
// ============================================================================

bench("BuilderBid.getValue - voltaire", () => {
	BuilderBid.getValue(bid);
});

await run();

// ============================================================================
// toHex
// ============================================================================

bench("BuilderBid.toHex - voltaire", () => {
	BuilderBid.toHex(bid);
});

await run();
