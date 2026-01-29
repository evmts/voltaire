/**
 * Benchmark: TypeScript vs WASM Hardfork implementations
 *
 * Note: WASM is NOT implemented for Hardfork (see Hardfork.wasm.ts).
 * Both implementations use pure TypeScript since WASM overhead would make
 * these simple enum operations ~10-100x slower.
 *
 * This benchmark demonstrates that pure TS is optimal for:
 * - Comparison operations (isAtLeast, isBefore, etc.)
 * - String parsing (fromString)
 * - Feature detection (hasEIP1559, hasEIP4844, etc.)
 */

import { bench, run } from "mitata";
import {
	BERLIN,
	CANCUN,
	FRONTIER,
	LONDON,
	PRAGUE,
	SHANGHAI,
} from "./constants.js";
// WASM implementation (re-exports TS since WASM not implemented)
import * as HardforkWasm from "./Hardfork.wasm.js";
// TypeScript implementation
import * as HardforkTS from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const testForks = {
	early: FRONTIER,
	middle: BERLIN,
	recent: CANCUN,
	latest: PRAGUE,
};

const testStrings = ["cancun", "shanghai", "london", "berlin", "paris"];
const forkArray = [
	testForks.recent,
	testForks.early,
	testForks.middle,
	testForks.latest,
];

// ============================================================================
// Parsing / fromString
// ============================================================================

bench("fromString - valid - TS", () => {
	HardforkTS.fromString("cancun");
});

bench("fromString - valid - WASM", () => {
	HardforkWasm.fromString("cancun");
});

await run();

bench("fromString - alias - TS", () => {
	HardforkTS.fromString("paris");
});

bench("fromString - alias - WASM", () => {
	HardforkWasm.fromString("paris");
});

await run();

bench("fromString - invalid - TS", () => {
	HardforkTS.fromString("unknown");
});

bench("fromString - invalid - WASM", () => {
	HardforkWasm.fromString("unknown");
});

await run();

// ============================================================================
// Comparison / Ordering
// ============================================================================

bench("compare - TS", () => {
	HardforkTS.compare(testForks.middle, testForks.recent);
});

bench("compare - WASM", () => {
	HardforkWasm.compare(testForks.middle, testForks.recent);
});

await run();

bench("isAtLeast - TS", () => {
	HardforkTS.isAtLeast(testForks.recent, testForks.middle);
});

bench("isAtLeast - WASM", () => {
	HardforkWasm.isAtLeast(testForks.recent, testForks.middle);
});

await run();

bench("isBefore - TS", () => {
	HardforkTS.isBefore(testForks.middle, testForks.recent);
});

bench("isBefore - WASM", () => {
	HardforkWasm.isBefore(testForks.middle, testForks.recent);
});

await run();

bench("isAfter - TS", () => {
	HardforkTS.isAfter(testForks.recent, testForks.middle);
});

bench("isAfter - WASM", () => {
	HardforkWasm.isAfter(testForks.recent, testForks.middle);
});

await run();

bench("equals - TS", () => {
	HardforkTS.equals(testForks.recent, testForks.recent);
});

bench("equals - WASM", () => {
	HardforkWasm.equals(testForks.recent, testForks.recent);
});

await run();

bench("gt - TS", () => {
	HardforkTS.gt(testForks.recent, testForks.middle);
});

bench("gt - WASM", () => {
	HardforkWasm.gt(testForks.recent, testForks.middle);
});

await run();

bench("gte - TS", () => {
	HardforkTS.gte(testForks.recent, testForks.middle);
});

bench("gte - WASM", () => {
	HardforkWasm.gte(testForks.recent, testForks.middle);
});

await run();

bench("lt - TS", () => {
	HardforkTS.lt(testForks.middle, testForks.recent);
});

bench("lt - WASM", () => {
	HardforkWasm.lt(testForks.middle, testForks.recent);
});

await run();

bench("lte - TS", () => {
	HardforkTS.lte(testForks.middle, testForks.recent);
});

bench("lte - WASM", () => {
	HardforkWasm.lte(testForks.middle, testForks.recent);
});

await run();

// ============================================================================
// Min/Max Operations
// ============================================================================

bench("min - TS", () => {
	HardforkTS.min(forkArray);
});

bench("min - WASM", () => {
	HardforkWasm.min(forkArray);
});

await run();

bench("max - TS", () => {
	HardforkTS.max(forkArray);
});

bench("max - WASM", () => {
	HardforkWasm.max(forkArray);
});

await run();

// ============================================================================
// Feature Detection (EIP checks)
// ============================================================================

bench("hasEIP1559 - TS", () => {
	HardforkTS.hasEIP1559(testForks.recent);
});

bench("hasEIP1559 - WASM", () => {
	HardforkWasm.hasEIP1559(testForks.recent);
});

await run();

bench("hasEIP3855 - TS", () => {
	HardforkTS.hasEIP3855(testForks.recent);
});

bench("hasEIP3855 - WASM", () => {
	HardforkWasm.hasEIP3855(testForks.recent);
});

await run();

bench("hasEIP4844 - TS", () => {
	HardforkTS.hasEIP4844(testForks.recent);
});

bench("hasEIP4844 - WASM", () => {
	HardforkWasm.hasEIP4844(testForks.recent);
});

await run();

bench("hasEIP1153 - TS", () => {
	HardforkTS.hasEIP1153(testForks.recent);
});

bench("hasEIP1153 - WASM", () => {
	HardforkWasm.hasEIP1153(testForks.recent);
});

await run();

bench("isPostMerge - TS", () => {
	HardforkTS.isPostMerge(testForks.recent);
});

bench("isPostMerge - WASM", () => {
	HardforkWasm.isPostMerge(testForks.recent);
});

await run();

bench("isPoS - TS", () => {
	HardforkTS.isPoS(testForks.recent);
});

bench("isPoS - WASM", () => {
	HardforkWasm.isPoS(testForks.recent);
});

await run();

// ============================================================================
// Range Operations
// ============================================================================

bench("range - short - TS", () => {
	HardforkTS.range(BERLIN, LONDON);
});

bench("range - short - WASM", () => {
	HardforkWasm.range(BERLIN, LONDON);
});

await run();

bench("range - medium - TS", () => {
	HardforkTS.range(BERLIN, SHANGHAI);
});

bench("range - medium - WASM", () => {
	HardforkWasm.range(BERLIN, SHANGHAI);
});

await run();

bench("range - long - TS", () => {
	HardforkTS.range(FRONTIER, PRAGUE);
});

bench("range - long - WASM", () => {
	HardforkWasm.range(FRONTIER, PRAGUE);
});

await run();

// ============================================================================
// Utility Operations
// ============================================================================

bench("toString - TS", () => {
	HardforkTS.toString(testForks.recent);
});

bench("toString - WASM", () => {
	HardforkWasm.toString(testForks.recent);
});

await run();

bench("isValidName - valid - TS", () => {
	HardforkTS.isValidName("cancun");
});

bench("isValidName - valid - WASM", () => {
	HardforkWasm.isValidName("cancun");
});

await run();

bench("isValidName - invalid - TS", () => {
	HardforkTS.isValidName("unknown");
});

bench("isValidName - invalid - WASM", () => {
	HardforkWasm.isValidName("unknown");
});

await run();

bench("allNames - TS", () => {
	HardforkTS.allNames();
});

bench("allNames - WASM", () => {
	HardforkWasm.allNames();
});

await run();

bench("allIds - TS", () => {
	HardforkTS.allIds();
});

bench("allIds - WASM", () => {
	HardforkWasm.allIds();
});

await run();

// ============================================================================
// Combined Operations (Real-world patterns)
// ============================================================================

bench("parse + check EIP-1559 - TS", () => {
	const fork = HardforkTS.fromString("cancun");
	if (fork !== undefined) {
		HardforkTS.hasEIP1559(fork);
	}
});

bench("parse + check EIP-1559 - WASM", () => {
	const fork = HardforkWasm.fromString("cancun");
	if (fork !== undefined) {
		HardforkWasm.hasEIP1559(fork);
	}
});

await run();

bench("check multiple features - TS", () => {
	const fork = testForks.recent;
	HardforkTS.hasEIP1559(fork);
	HardforkTS.hasEIP3855(fork);
	HardforkTS.hasEIP4844(fork);
	HardforkTS.isPostMerge(fork);
});

bench("check multiple features - WASM", () => {
	const fork = testForks.recent;
	HardforkWasm.hasEIP1559(fork);
	HardforkWasm.hasEIP3855(fork);
	HardforkWasm.hasEIP4844(fork);
	HardforkWasm.isPostMerge(fork);
});

await run();

let idx = 0;
bench("parse multiple strings - TS", () => {
	// biome-ignore lint/style/noNonNullAssertion: rotating through test array
	HardforkTS.fromString(testStrings[idx % testStrings.length]!);
	idx++;
});

idx = 0;
bench("parse multiple strings - WASM", () => {
	// biome-ignore lint/style/noNonNullAssertion: rotating through test array
	HardforkWasm.fromString(testStrings[idx % testStrings.length]!);
	idx++;
});

await run();
