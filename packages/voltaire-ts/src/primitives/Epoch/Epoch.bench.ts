/**
 * Benchmark: Epoch (Beacon Chain) operations
 * Tests epoch creation and slot conversion
 */

import { bench, run } from "mitata";
import * as Epoch from "./index.js";

// Test data
const epochNumber = 100000;
const epochBigInt = 100000n;

// Pre-created epochs
const epoch1 = Epoch.from(100000);
const epoch2 = Epoch.from(100001);

// ============================================================================
// from (constructor)
// ============================================================================

bench("Epoch.from - number - voltaire", () => {
	Epoch.from(epochNumber);
});

bench("Epoch.from - bigint - voltaire", () => {
	Epoch.from(epochBigInt);
});

await run();

// ============================================================================
// toNumber
// ============================================================================

bench("Epoch.toNumber - voltaire", () => {
	Epoch.toNumber(epoch1);
});

await run();

// ============================================================================
// toBigInt
// ============================================================================

bench("Epoch.toBigInt - voltaire", () => {
	Epoch.toBigInt(epoch1);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("Epoch.equals - same - voltaire", () => {
	Epoch.equals(epoch1, epoch1);
});

bench("Epoch.equals - different - voltaire", () => {
	Epoch.equals(epoch1, epoch2);
});

await run();

// ============================================================================
// toSlot (epoch to slot conversion)
// ============================================================================

bench("Epoch.toSlot - voltaire", () => {
	Epoch.toSlot(epoch1);
});

await run();
