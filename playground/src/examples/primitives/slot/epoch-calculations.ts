import * as Slot from "../../../primitives/Slot/index.js";

// Example: Epoch calculations
// Ethereum PoS uses epochs (32 slots each) for validator duties and finality

const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;

console.log("=== Epoch Basics ===");
console.log("Slots per epoch:", SLOTS_PER_EPOCH);
console.log("Seconds per slot:", SECONDS_PER_SLOT);
console.log(
	"Seconds per epoch:",
	SLOTS_PER_EPOCH * SECONDS_PER_SLOT,
	"(6.4 minutes)",
);

// Convert various slots to epochs
const slots = [0, 1, 31, 32, 33, 63, 64, 96, 100, 1000, 10000];

console.log("\n=== Slot to Epoch Conversion ===");
for (const slotNum of slots) {
	const slot = Slot.from(slotNum);
	const epoch = Slot.toEpoch(slot);
	const positionInEpoch = slotNum % SLOTS_PER_EPOCH;
	console.log(
		`Slot ${slotNum.toString().padStart(5)} -> Epoch ${epoch.toString().padStart(3)} (position ${positionInEpoch}/32)`,
	);
}

// Calculate slot from epoch and position
console.log("\n=== Epoch to Slot Conversion ===");
function epochToSlot(epoch: bigint, position: number): bigint {
	return epoch * BigInt(SLOTS_PER_EPOCH) + BigInt(position);
}

const epochs = [0n, 1n, 2n, 10n, 100n, 1000n];
for (const epoch of epochs) {
	const firstSlot = epochToSlot(epoch, 0);
	const lastSlot = epochToSlot(epoch, 31);
	console.log(`Epoch ${epoch}: slots ${firstSlot} to ${lastSlot}`);
}

// Find epoch boundaries
console.log("\n=== Epoch Boundaries ===");
function isEpochBoundary(slot: bigint): boolean {
	return slot % BigInt(SLOTS_PER_EPOCH) === 0n;
}

const testSlots = [0n, 31n, 32n, 63n, 64n, 100n, 128n];
for (const slotNum of testSlots) {
	const slot = Slot.from(slotNum);
	const boundary = isEpochBoundary(slot);
	console.log(`Slot ${slotNum}: ${boundary ? "EPOCH START" : "mid-epoch"}`);
}

// Current epoch progress
console.log("\n=== Epoch Progress ===");
const currentSlot = Slot.from(7234567n);
const currentEpoch = Slot.toEpoch(currentSlot);
const slotInEpoch = Number(currentSlot) % SLOTS_PER_EPOCH;
const slotsRemaining = SLOTS_PER_EPOCH - slotInEpoch;
const progressPct = ((slotInEpoch / SLOTS_PER_EPOCH) * 100).toFixed(1);

console.log("Current slot:", currentSlot);
console.log("Current epoch:", currentEpoch);
console.log(`Progress: ${slotInEpoch}/${SLOTS_PER_EPOCH} (${progressPct}%)`);
console.log("Slots until next epoch:", slotsRemaining);
console.log("Seconds until next epoch:", slotsRemaining * SECONDS_PER_SLOT);

// Finality (2 epochs behind head)
console.log("\n=== Finality Calculation ===");
const EPOCHS_TO_FINALITY = 2;
const headSlot = Slot.from(7500000n);
const headEpoch = Slot.toEpoch(headSlot);
const finalizedEpoch = headEpoch - BigInt(EPOCHS_TO_FINALITY);
const finalizedSlot = Slot.from(finalizedEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Head slot:", headSlot);
console.log("Head epoch:", headEpoch);
console.log("Finalized epoch:", finalizedEpoch);
console.log("Finalized slot:", finalizedSlot);
console.log(
	"Slots between finalized and head:",
	Number(headSlot - finalizedSlot),
);
