import { Slot } from "@tevm/voltaire";
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
		const slot = Slot(input as any);
	} catch (error) {}
}
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
		const slot = Slot(input as any);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
	}
}

// Safe conversion to number
const safeSlot = Slot(1000000n);
try {
	const num = Slot.toNumber(safeSlot);
} catch (error) {}

// Unsafe conversion to number
const unsafeSlot = Slot(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
try {
	const num = Slot.toNumber(unsafeSlot);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
}
const SLOTS_PER_EPOCH = 32;

function validateEpochCalculation(slotNum: bigint): void {
	const slot = Slot(slotNum);
	const epoch = Slot.toEpoch(slot);
	const expectedEpoch = slotNum / BigInt(SLOTS_PER_EPOCH);

	if (epoch === expectedEpoch) {
	} else {
	}
}

validateEpochCalculation(0n);
validateEpochCalculation(31n);
validateEpochCalculation(32n);
validateEpochCalculation(63n);
validateEpochCalculation(64n);
validateEpochCalculation(1000000n);

const slot1 = Slot(1000000n);
const slot2 = Slot(1000000n);
const slot3 = Slot(1000001n);

function validateSlotRange(start: bigint, end: bigint): boolean {
	if (start < 0n) {
		return false;
	}
	if (end < 0n) {
		return false;
	}
	if (end < start) {
		return false;
	}
	return true;
}

validateSlotRange(1000000n, 1000100n);
validateSlotRange(1000100n, 1000000n); // Invalid: end < start
validateSlotRange(-100n, 100n); // Invalid: negative start
validateSlotRange(0n, 0n); // Valid: single slot

const baseSlot = Slot(1000000n);

// Addition
const nextSlot = Slot(baseSlot + 1n);

// Subtraction
const prevSlot = Slot(baseSlot - 1n);

// Difference
const slotA = Slot(1000100n);
const slotB = Slot(1000000n);
const difference = slotA - slotB;

// Prevent negative result
try {
	const slotC = Slot(1000000n);
	const slotD = Slot(1000100n);
	const invalid = Slot(slotC - slotD); // Negative
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
}

const boundaries = [
	{ value: 0n, label: "Minimum (genesis)" },
	{ value: BigInt(Number.MAX_SAFE_INTEGER), label: "Max safe integer" },
	{ value: 2n ** 64n - 1n, label: "Max uint64" },
	{ value: 2n ** 256n - 1n, label: "Max uint256" },
];

for (const { value, label } of boundaries) {
	try {
		const slot = Slot(value);
		const canConvertToNumber = value <= BigInt(Number.MAX_SAFE_INTEGER);
	} catch (error) {}
}
