/**
 * TopicFilter Benchmarks: Voltaire TS
 *
 * Compares performance of topic filter operations.
 * TopicFilter matches log topics against filter criteria.
 */

import { bench, run } from "mitata";
import type { HashType } from "../Hash/HashType.js";
import * as TopicFilter from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

function hexToHash(hex: string): HashType {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as HashType;
}

// Common event topics
const TRANSFER_TOPIC = hexToHash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const APPROVAL_TOPIC = hexToHash(
	"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
);
const SWAP_TOPIC = hexToHash(
	"0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
);

// Address topics (padded to 32 bytes)
const FROM_TOPIC = hexToHash(
	"0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
);
const TO_TOPIC = hexToHash(
	"0x000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc",
);
const RANDOM_TOPIC = hexToHash(
	"0x0000000000000000000000001111111111111111111111111111111111111111",
);

// Test log topics
const transferLogTopics = [TRANSFER_TOPIC, FROM_TOPIC, TO_TOPIC] as HashType[];
const _swapLogTopics = [
	SWAP_TOPIC,
	FROM_TOPIC,
	TO_TOPIC,
	RANDOM_TOPIC,
] as HashType[];

// Pre-created filters
const singleTopicFilter = TopicFilter.from([TRANSFER_TOPIC]);
const wildcardFilter = TopicFilter.from([TRANSFER_TOPIC, null]);
const fullMatchFilter = TopicFilter.from([
	TRANSFER_TOPIC,
	FROM_TOPIC,
	TO_TOPIC,
]);
const orFilter = TopicFilter.from([[TRANSFER_TOPIC, APPROVAL_TOPIC]]);
const complexFilter = TopicFilter.from([
	[TRANSFER_TOPIC, SWAP_TOPIC],
	FROM_TOPIC,
	null,
]);

// ============================================================================
// from benchmarks (filter creation)
// ============================================================================

bench("from - single topic - voltaire", () => {
	TopicFilter.from([TRANSFER_TOPIC]);
});

bench("from - with wildcard - voltaire", () => {
	TopicFilter.from([TRANSFER_TOPIC, null]);
});

bench("from - three topics - voltaire", () => {
	TopicFilter.from([TRANSFER_TOPIC, FROM_TOPIC, TO_TOPIC]);
});

await run();

bench("from - OR filter (2 options) - voltaire", () => {
	TopicFilter.from([[TRANSFER_TOPIC, APPROVAL_TOPIC]]);
});

bench("from - complex OR + wildcard - voltaire", () => {
	TopicFilter.from([[TRANSFER_TOPIC, SWAP_TOPIC], FROM_TOPIC, null]);
});

await run();

// ============================================================================
// isEmpty benchmarks
// ============================================================================

const emptyFilter = TopicFilter.from([]);

bench("isEmpty - empty filter - voltaire", () => {
	TopicFilter.isEmpty(emptyFilter);
});

bench("isEmpty - single topic filter - voltaire", () => {
	TopicFilter.isEmpty(singleTopicFilter);
});

bench("isEmpty - complex filter - voltaire", () => {
	TopicFilter.isEmpty(complexFilter);
});

await run();

// ============================================================================
// matches benchmarks
// ============================================================================

bench("matches - single topic - voltaire", () => {
	TopicFilter.matches(singleTopicFilter, transferLogTopics);
});

bench("matches - with wildcard - voltaire", () => {
	TopicFilter.matches(wildcardFilter, transferLogTopics);
});

bench("matches - full match (3 topics) - voltaire", () => {
	TopicFilter.matches(fullMatchFilter, transferLogTopics);
});

await run();

bench("matches - OR filter - voltaire", () => {
	TopicFilter.matches(orFilter, transferLogTopics);
});

bench("matches - complex filter - voltaire", () => {
	TopicFilter.matches(complexFilter, transferLogTopics);
});

await run();

// Non-matching cases
const nonMatchingTopics = [APPROVAL_TOPIC, FROM_TOPIC, TO_TOPIC] as HashType[];

bench("matches - no match (topic0) - voltaire", () => {
	TopicFilter.matches(singleTopicFilter, nonMatchingTopics);
});

bench("matches - no match (topic1) - voltaire", () => {
	TopicFilter.matches(
		TopicFilter.from([TRANSFER_TOPIC, RANDOM_TOPIC]),
		transferLogTopics,
	);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const manyLogs = Array.from({ length: 100 }, (_, i) => {
	const topic0 = i % 2 === 0 ? TRANSFER_TOPIC : SWAP_TOPIC;
	const topic1 = i % 3 === 0 ? FROM_TOPIC : RANDOM_TOPIC;
	return [topic0, topic1, TO_TOPIC] as HashType[];
});

bench("matches - 100 logs with OR filter - voltaire", () => {
	for (const topics of manyLogs) {
		TopicFilter.matches(orFilter, topics);
	}
});

bench("matches - 100 logs with complex filter - voltaire", () => {
	for (const topics of manyLogs) {
		TopicFilter.matches(complexFilter, topics);
	}
});

await run();
