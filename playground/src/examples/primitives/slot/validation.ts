import * as Slot from "../../../primitives/Slot/index.js";

// Example: Slot validation and error handling
// Proper validation when working with slot numbers

console.log("=== Slot Validation ===");

// Valid slot creation
console.log("\n=== Valid Slots ===");
const validInputs = [
	{ input: 0, label: "Zero" },
	{ input: 0n, label: "Zero bigint" },
	{ input: 1000000, label: "Number" },
	{ input: 1000000n, label: "BigInt" },
	{ input: "1000000", label: "Decimal string" },
	{ input: "0xf4240", label: "Hex string" },
	{ input: Number.MAX_SAFE_INTEGER, label: "Max safe integer" },
];

for (const { input, label } of validInputs) {
	try {
		const slot = Slot.from(input as any);
		console.log(`✓ ${label.padEnd(20)}: ${slot}`);
	} catch (error) {
		console.log(`✗ ${label.padEnd(20)}: ${error}`);
	}
}

// Invalid slot creation
console.log("\n=== Invalid Slots (Expected Errors) ===");
const invalidInputs = [
	{ input: -1, label: "Negative number" },
	{ input: -100n, label: "Negative bigint" },
	{ input: 1.5, label: "Non-integer" },
	{ input: Number.NaN, label: "NaN" },
	{ input: Number.POSITIVE_INFINITY, label: "Infinity" },
	{ input: Number.NEGATIVE_INFINITY, label: "Negative infinity" },
	{ input: Number.MAX_SAFE_INTEGER + 1, label: "Unsafe integer" },
];

for (const { input, label } of invalidInputs) {
	try {
		const slot = Slot.from(input as any);
		console.log(`✗ ${label.padEnd(25)}: SHOULD HAVE FAILED (got ${slot})`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(`✓ ${label.padEnd(25)}: Rejected (${message.slice(0, 30)}...)`);
	}
}

// Slot conversion validation
console.log("\n=== Conversion Validation ===");

// Safe conversion to number
const safeSlot = Slot.from(1000000n);
try {
	const num = Slot.toNumber(safeSlot);
	console.log(`✓ Safe conversion: ${safeSlot} -> ${num}`);
} catch (error) {
	console.log(`✗ Safe conversion failed: ${error}`);
}

// Unsafe conversion to number
const unsafeSlot = Slot.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
try {
	const num = Slot.toNumber(unsafeSlot);
	console.log(`✗ Unsafe conversion: SHOULD HAVE FAILED (got ${num})`);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.log(`✓ Unsafe conversion: Rejected (${message})`);
}

// Epoch validation
console.log("\n=== Epoch Calculation Validation ===");
const SLOTS_PER_EPOCH = 32;

function validateEpochCalculation(slotNum: bigint): void {
	const slot = Slot.from(slotNum);
	const epoch = Slot.toEpoch(slot);
	const expectedEpoch = slotNum / BigInt(SLOTS_PER_EPOCH);

	if (epoch === expectedEpoch) {
		console.log(`✓ Slot ${slot} -> Epoch ${epoch} (correct)`);
	} else {
		console.log(`✗ Slot ${slot} -> Epoch ${epoch} (expected ${expectedEpoch})`);
	}
}

validateEpochCalculation(0n);
validateEpochCalculation(31n);
validateEpochCalculation(32n);
validateEpochCalculation(63n);
validateEpochCalculation(64n);
validateEpochCalculation(1000000n);

// Slot comparison validation
console.log("\n=== Comparison Validation ===");

const slot1 = Slot.from(1000000n);
const slot2 = Slot.from(1000000n);
const slot3 = Slot.from(1000001n);

console.log("slot1:", slot1);
console.log("slot2:", slot2);
console.log("slot3:", slot3);

console.log("\nEquals:");
console.log(`  slot1 === slot2: ${slot1 === slot2} (same value)`);
console.log(`  Slot.equals(slot1, slot2): ${Slot.equals(slot1, slot2)}`);
console.log(`  Slot.equals(slot1, slot3): ${Slot.equals(slot1, slot3)}`);

console.log("\nOrderings:");
console.log(`  slot1 < slot3: ${slot1 < slot3}`);
console.log(`  slot3 > slot1: ${slot3 > slot1}`);
console.log(`  slot1 <= slot2: ${slot1 <= slot2}`);
console.log(`  slot2 >= slot1: ${slot2 >= slot1}`);

// Range validation
console.log("\n=== Range Validation ===");

function validateSlotRange(start: bigint, end: bigint): boolean {
	if (start < 0n) {
		console.log(`✗ Invalid range: start ${start} is negative`);
		return false;
	}
	if (end < 0n) {
		console.log(`✗ Invalid range: end ${end} is negative`);
		return false;
	}
	if (end < start) {
		console.log(`✗ Invalid range: end ${end} < start ${start}`);
		return false;
	}
	console.log(`✓ Valid range: ${start} to ${end}`);
	return true;
}

validateSlotRange(1000000n, 1000100n);
validateSlotRange(1000100n, 1000000n); // Invalid: end < start
validateSlotRange(-100n, 100n); // Invalid: negative start
validateSlotRange(0n, 0n); // Valid: single slot

// Arithmetic validation
console.log("\n=== Arithmetic Validation ===");

const baseSlot = Slot.from(1000000n);
console.log("Base slot:", baseSlot);

// Addition
const nextSlot = Slot.from(baseSlot + 1n);
console.log(`  +1: ${nextSlot}`);

// Subtraction
const prevSlot = Slot.from(baseSlot - 1n);
console.log(`  -1: ${prevSlot}`);

// Difference
const slotA = Slot.from(1000100n);
const slotB = Slot.from(1000000n);
const difference = slotA - slotB;
console.log(`  ${slotA} - ${slotB}: ${difference}`);

// Prevent negative result
try {
	const slotC = Slot.from(1000000n);
	const slotD = Slot.from(1000100n);
	const invalid = Slot.from(slotC - slotD); // Negative
	console.log(`✗ Should have failed: ${invalid}`);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.log(`✓ Prevented negative slot: ${message.slice(0, 40)}...`);
}

// Boundary conditions
console.log("\n=== Boundary Conditions ===");

const boundaries = [
	{ value: 0n, label: "Minimum (genesis)" },
	{ value: BigInt(Number.MAX_SAFE_INTEGER), label: "Max safe integer" },
	{ value: 2n ** 64n - 1n, label: "Max uint64" },
	{ value: 2n ** 256n - 1n, label: "Max uint256" },
];

for (const { value, label } of boundaries) {
	try {
		const slot = Slot.from(value);
		const canConvertToNumber = value <= BigInt(Number.MAX_SAFE_INTEGER);
		console.log(
			`✓ ${label.padEnd(25)}: Valid (toNumber: ${canConvertToNumber ? "safe" : "unsafe"})`,
		);
	} catch (error) {
		console.log(`✗ ${label.padEnd(25)}: ${error}`);
	}
}
