/**
 * Benchmark: ChainHead operations
 * Tests chain head state parsing
 */

import { bench, run } from "mitata";
import * as ChainHead from "./index.js";

// Test data - realistic chain head state
const chainHeadData = {
	hash: "0x" + "ab".repeat(32),
	number: 18000000n,
	parentHash: "0x" + "cd".repeat(32),
	timestamp: 1700000000n,
	baseFeePerGas: 30000000000n,
};

const minimalChainHead = {
	hash: "0x" + "ef".repeat(32),
	number: 1000n,
	parentHash: "0x" + "00".repeat(32),
	timestamp: 1600000000n,
};

// ============================================================================
// from (constructor)
// ============================================================================

bench("ChainHead.from - full - voltaire", () => {
	ChainHead.from(chainHeadData);
});

bench("ChainHead.from - minimal - voltaire", () => {
	ChainHead.from(minimalChainHead);
});

await run();
