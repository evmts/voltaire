/**
 * FilterId Benchmarks: Voltaire TS
 *
 * Compares performance of filter ID operations.
 * FilterId is returned by eth_newFilter for tracking log subscriptions.
 */

import { bench, run } from "mitata";
import * as FilterId from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Common filter ID formats
const HEX_FILTER_ID_SHORT = "0x1";
const HEX_FILTER_ID_MEDIUM = "0x1a2b3c";
const HEX_FILTER_ID_LONG = "0x1a2b3c4d5e6f7890";
const HEX_FILTER_ID_FULL =
	"0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890";

// Number filter IDs
const NUMBER_FILTER_ID_SMALL = 1n;
const NUMBER_FILTER_ID_MEDIUM = 12345n;
const NUMBER_FILTER_ID_LARGE = 1234567890n;

// Pre-created filter IDs
const filterShort = FilterId.from(HEX_FILTER_ID_SHORT);
const filterMedium = FilterId.from(HEX_FILTER_ID_MEDIUM);
const filterLong = FilterId.from(HEX_FILTER_ID_LONG);
const filterFull = FilterId.from(HEX_FILTER_ID_FULL);

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - short hex - voltaire", () => {
	FilterId.from(HEX_FILTER_ID_SHORT);
});

bench("from - medium hex - voltaire", () => {
	FilterId.from(HEX_FILTER_ID_MEDIUM);
});

bench("from - long hex - voltaire", () => {
	FilterId.from(HEX_FILTER_ID_LONG);
});

bench("from - full hex - voltaire", () => {
	FilterId.from(HEX_FILTER_ID_FULL);
});

await run();

bench("from - small bigint - voltaire", () => {
	FilterId.from(NUMBER_FILTER_ID_SMALL);
});

bench("from - medium bigint - voltaire", () => {
	FilterId.from(NUMBER_FILTER_ID_MEDIUM);
});

bench("from - large bigint - voltaire", () => {
	FilterId.from(NUMBER_FILTER_ID_LARGE);
});

await run();

// ============================================================================
// toString benchmarks
// ============================================================================

bench("toString - short - voltaire", () => {
	FilterId.toString(filterShort);
});

bench("toString - medium - voltaire", () => {
	FilterId.toString(filterMedium);
});

bench("toString - long - voltaire", () => {
	FilterId.toString(filterLong);
});

bench("toString - full - voltaire", () => {
	FilterId.toString(filterFull);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

const filterShort2 = FilterId.from(HEX_FILTER_ID_SHORT);

bench("equals - same ID - voltaire", () => {
	FilterId.equals(filterShort, filterShort2);
});

bench("equals - different ID - voltaire", () => {
	FilterId.equals(filterShort, filterLong);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const filterIds = [
	HEX_FILTER_ID_SHORT,
	HEX_FILTER_ID_MEDIUM,
	HEX_FILTER_ID_LONG,
	HEX_FILTER_ID_FULL,
];

bench("from - 4 filter IDs - voltaire", () => {
	for (const id of filterIds) {
		FilterId.from(id);
	}
});

await run();

const createdFilters = filterIds.map((id) => FilterId.from(id));

bench("toString - 4 filter IDs - voltaire", () => {
	for (const filter of createdFilters) {
		FilterId.toString(filter);
	}
});

await run();
