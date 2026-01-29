/**
 * Slot Module Benchmarks (Beacon Chain)
 *
 * Measures performance of Slot operations for consensus layer
 */

import { bench, run } from "mitata";
import * as Slot from "./index.js";
import type { SlotType } from "./SlotType.js";

// ============================================================================
// Test Data - Realistic slot numbers
// ============================================================================

// Current mainnet slot (approximate as of late 2024)
const currentSlot = 8000000n;

// Genesis slot
const genesisSlot = 0n;

// First slot after merge (Bellatrix)
const mergeSlot = 4700000n;

// Future slot
const futureSlot = 20000000n;

// Maximum safe integer as bigint
const maxSafeSlot = BigInt(Number.MAX_SAFE_INTEGER);

// Very large slot (edge case)
const veryLargeSlot = 0xffffffffffffffffn;

// Pre-created slot values
const slot0: SlotType = Slot.from(0n);
const slot1: SlotType = Slot.from(1n);
const slot100: SlotType = Slot.from(100n);
const slotCurrent: SlotType = Slot.from(currentSlot);
const slotMerge: SlotType = Slot.from(mergeSlot);
const slotFuture: SlotType = Slot.from(futureSlot);
const slotMaxSafe: SlotType = Slot.from(maxSafeSlot);

// ============================================================================
// Benchmarks - Slot.from
// ============================================================================

bench("Slot.from - zero (bigint) - voltaire", () => {
	Slot.from(0n);
});

bench("Slot.from - small (bigint) - voltaire", () => {
	Slot.from(100n);
});

bench("Slot.from - current (bigint) - voltaire", () => {
	Slot.from(currentSlot);
});

bench("Slot.from - large (bigint) - voltaire", () => {
	Slot.from(veryLargeSlot);
});

await run();

// ============================================================================
// Benchmarks - Slot.from (number input)
// ============================================================================

bench("Slot.from - zero (number) - voltaire", () => {
	Slot.from(0);
});

bench("Slot.from - small (number) - voltaire", () => {
	Slot.from(100);
});

bench("Slot.from - current (number) - voltaire", () => {
	Slot.from(8000000);
});

bench("Slot.from - max safe integer (number) - voltaire", () => {
	Slot.from(Number.MAX_SAFE_INTEGER);
});

await run();

// ============================================================================
// Benchmarks - Slot.from (string input)
// ============================================================================

bench("Slot.from - zero (string) - voltaire", () => {
	Slot.from("0");
});

bench("Slot.from - decimal string - voltaire", () => {
	Slot.from("8000000");
});

bench("Slot.from - hex string - voltaire", () => {
	Slot.from("0x7a1200");
});

bench("Slot.from - large hex string - voltaire", () => {
	Slot.from("0xffffffffffffffff");
});

await run();

// ============================================================================
// Benchmarks - Slot.toNumber
// ============================================================================

bench("Slot.toNumber - zero - voltaire", () => {
	Slot.toNumber(slot0);
});

bench("Slot.toNumber - small - voltaire", () => {
	Slot.toNumber(slot100);
});

bench("Slot.toNumber - current - voltaire", () => {
	Slot.toNumber(slotCurrent);
});

bench("Slot.toNumber - max safe - voltaire", () => {
	Slot.toNumber(slotMaxSafe);
});

await run();

// ============================================================================
// Benchmarks - Slot.toBigInt
// ============================================================================

bench("Slot.toBigInt - zero - voltaire", () => {
	Slot.toBigInt(slot0);
});

bench("Slot.toBigInt - small - voltaire", () => {
	Slot.toBigInt(slot100);
});

bench("Slot.toBigInt - current - voltaire", () => {
	Slot.toBigInt(slotCurrent);
});

bench("Slot.toBigInt - future - voltaire", () => {
	Slot.toBigInt(slotFuture);
});

await run();

// ============================================================================
// Benchmarks - Slot.equals
// ============================================================================

bench("Slot.equals - same reference - voltaire", () => {
	Slot.equals(slotCurrent, slotCurrent);
});

bench("Slot.equals - equal values - voltaire", () => {
	const slot1Copy = Slot.from(currentSlot);
	Slot.equals(slotCurrent, slot1Copy);
});

bench("Slot.equals - different values - voltaire", () => {
	Slot.equals(slotCurrent, slotMerge);
});

bench("Slot.equals - zero vs zero - voltaire", () => {
	Slot.equals(slot0, Slot.from(0n));
});

bench("Slot.equals - small difference - voltaire", () => {
	Slot.equals(slot0, slot1);
});

await run();

// ============================================================================
// Benchmarks - Slot.toEpoch
// ============================================================================

bench("Slot.toEpoch - genesis slot - voltaire", () => {
	Slot.toEpoch(slot0);
});

bench("Slot.toEpoch - slot 31 (epoch 0) - voltaire", () => {
	Slot.toEpoch(Slot.from(31n));
});

bench("Slot.toEpoch - slot 32 (epoch 1) - voltaire", () => {
	Slot.toEpoch(Slot.from(32n));
});

bench("Slot.toEpoch - current slot - voltaire", () => {
	Slot.toEpoch(slotCurrent);
});

bench("Slot.toEpoch - merge slot - voltaire", () => {
	Slot.toEpoch(slotMerge);
});

bench("Slot.toEpoch - future slot - voltaire", () => {
	Slot.toEpoch(slotFuture);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("Slot.from x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		Slot.from(BigInt(i * 1000000));
	}
});

bench("Slot.toEpoch x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		Slot.toEpoch(Slot.from(BigInt(i * 1000000)));
	}
});

bench("Slot.equals x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		Slot.equals(slotCurrent, Slot.from(BigInt(8000000 + i)));
	}
});

await run();

// ============================================================================
// Benchmarks - Full Workflow
// ============================================================================

bench("Slot workflow - create, convert, compare - voltaire", () => {
	// Create from number
	const s1 = Slot.from(8000000);
	// Create from bigint
	const s2 = Slot.from(8000001n);
	// Convert to epoch
	Slot.toEpoch(s1);
	// Compare
	Slot.equals(s1, s2);
	// Convert to number
	Slot.toNumber(s1);
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("Slot.from - negative throws - voltaire", () => {
	try {
		Slot.from(-1n);
	} catch {
		// Expected
	}
});

bench("Slot.from - unsafe integer throws - voltaire", () => {
	try {
		Slot.from(Number.MAX_SAFE_INTEGER + 1);
	} catch {
		// Expected
	}
});

await run();
