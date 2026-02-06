/**
 * LogIndex Benchmarks: Voltaire TS
 *
 * Compares performance of log index operations.
 * LogIndex represents the position of a log within a block.
 */

import { bench, run } from "mitata";
import * as LogIndex from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Common log indices
const INDEX_ZERO = 0;
const INDEX_SMALL = 42;
const INDEX_MEDIUM = 255;
const INDEX_LARGE = 1000;
const INDEX_MAX = 65535;

// Pre-created indices
const indexZero = LogIndex.from(INDEX_ZERO);
const indexSmall = LogIndex.from(INDEX_SMALL);
const indexMedium = LogIndex.from(INDEX_MEDIUM);
const indexLarge = LogIndex.from(INDEX_LARGE);

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - zero - voltaire", () => {
	LogIndex.from(INDEX_ZERO);
});

bench("from - small (42) - voltaire", () => {
	LogIndex.from(INDEX_SMALL);
});

bench("from - medium (255) - voltaire", () => {
	LogIndex.from(INDEX_MEDIUM);
});

bench("from - large (1000) - voltaire", () => {
	LogIndex.from(INDEX_LARGE);
});

bench("from - max (65535) - voltaire", () => {
	LogIndex.from(INDEX_MAX);
});

await run();

// ============================================================================
// toNumber benchmarks
// ============================================================================

bench("toNumber - zero - voltaire", () => {
	LogIndex.toNumber(indexZero);
});

bench("toNumber - small - voltaire", () => {
	LogIndex.toNumber(indexSmall);
});

bench("toNumber - medium - voltaire", () => {
	LogIndex.toNumber(indexMedium);
});

bench("toNumber - large - voltaire", () => {
	LogIndex.toNumber(indexLarge);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

const indexSmall2 = LogIndex.from(INDEX_SMALL);

bench("equals - same index - voltaire", () => {
	LogIndex.equals(indexSmall, indexSmall2);
});

bench("equals - different index - voltaire", () => {
	LogIndex.equals(indexSmall, indexLarge);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const indices = [0, 1, 10, 42, 100, 255, 500, 1000];

bench("from - 8 indices - voltaire", () => {
	for (const i of indices) {
		LogIndex.from(i);
	}
});

await run();

const createdIndices = indices.map((i) => LogIndex.from(i));

bench("toNumber - 8 indices - voltaire", () => {
	for (const i of createdIndices) {
		LogIndex.toNumber(i);
	}
});

await run();
