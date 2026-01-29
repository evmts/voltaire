/**
 * LogFilter Benchmarks: Voltaire TS
 *
 * Compares performance of log filter operations.
 * LogFilter defines criteria for filtering Ethereum logs.
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import * as LogFilter from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Helper to create test addresses/hashes
function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function hexToAddress(hex: string): AddressType {
	return hexToBytes(hex) as AddressType;
}

function hexToHash(hex: string): HashType {
	return hexToBytes(hex) as HashType;
}

// Test addresses
const USDC_ADDRESS = hexToAddress(
	"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
);
const UNISWAP_PAIR = hexToAddress(
	"0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc",
);
const RANDOM_ADDR = hexToAddress(
	"0x1111111111111111111111111111111111111111",
);

// Test topics (Transfer event)
const TRANSFER_TOPIC = hexToHash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const FROM_TOPIC = hexToHash(
	"0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
);
const TO_TOPIC = hexToHash(
	"0x000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc",
);

// Pre-created filters
const simpleFilter = LogFilter.from({
	address: USDC_ADDRESS,
});

const filterWithTopics = LogFilter.from({
	address: USDC_ADDRESS,
	topics: [TRANSFER_TOPIC],
});

const filterWithBlockRange = LogFilter.from({
	address: USDC_ADDRESS,
	fromBlock: 18000000n,
	toBlock: 18001000n,
});

const complexFilter = LogFilter.from({
	address: [USDC_ADDRESS, UNISWAP_PAIR],
	topics: [TRANSFER_TOPIC, FROM_TOPIC, TO_TOPIC],
	fromBlock: 18000000n,
	toBlock: "latest",
});

// Test log for matching
const testLog = {
	address: USDC_ADDRESS,
	topics: [TRANSFER_TOPIC, FROM_TOPIC, TO_TOPIC] as HashType[],
	data: new Uint8Array(32),
	blockNumber: 18000500n,
	logIndex: 42,
	transactionIndex: 15,
	transactionHash: hexToHash(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	blockHash: hexToHash(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
};

// ============================================================================
// from benchmarks (filter creation)
// ============================================================================

bench("from - address only - voltaire", () => {
	LogFilter.from({ address: USDC_ADDRESS });
});

bench("from - address + topic - voltaire", () => {
	LogFilter.from({
		address: USDC_ADDRESS,
		topics: [TRANSFER_TOPIC],
	});
});

bench("from - with block range - voltaire", () => {
	LogFilter.from({
		address: USDC_ADDRESS,
		fromBlock: 18000000n,
		toBlock: 18001000n,
	});
});

await run();

bench("from - multiple addresses - voltaire", () => {
	LogFilter.from({
		address: [USDC_ADDRESS, UNISWAP_PAIR, RANDOM_ADDR],
	});
});

bench("from - complex filter - voltaire", () => {
	LogFilter.from({
		address: [USDC_ADDRESS, UNISWAP_PAIR],
		topics: [TRANSFER_TOPIC, FROM_TOPIC, TO_TOPIC],
		fromBlock: 18000000n,
		toBlock: "latest",
	});
});

await run();

// ============================================================================
// isEmpty benchmarks
// ============================================================================

const emptyFilter = LogFilter.from({});

bench("isEmpty - empty filter - voltaire", () => {
	LogFilter.isEmpty(emptyFilter);
});

bench("isEmpty - simple filter - voltaire", () => {
	LogFilter.isEmpty(simpleFilter);
});

bench("isEmpty - complex filter - voltaire", () => {
	LogFilter.isEmpty(complexFilter);
});

await run();

// ============================================================================
// matches benchmarks
// ============================================================================

bench("matches - address only filter - voltaire", () => {
	LogFilter.matches(simpleFilter, testLog);
});

bench("matches - with topics filter - voltaire", () => {
	LogFilter.matches(filterWithTopics, testLog);
});

bench("matches - with block range - voltaire", () => {
	LogFilter.matches(filterWithBlockRange, testLog);
});

bench("matches - complex filter - voltaire", () => {
	LogFilter.matches(complexFilter, testLog);
});

await run();

// Non-matching case
const nonMatchingLog = {
	...testLog,
	address: RANDOM_ADDR,
};

bench("matches - no match (address) - voltaire", () => {
	LogFilter.matches(simpleFilter, nonMatchingLog);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const logs = Array.from({ length: 100 }, (_, i) => ({
	...testLog,
	address: i % 2 === 0 ? USDC_ADDRESS : UNISWAP_PAIR,
	blockNumber: BigInt(18000000 + i),
	logIndex: i,
}));

bench("matches - 100 logs - voltaire", () => {
	for (const log of logs) {
		LogFilter.matches(filterWithTopics, log);
	}
});

await run();
