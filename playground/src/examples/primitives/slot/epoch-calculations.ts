import { Slot } from "voltaire";
// Example: Epoch calculations
// Ethereum PoS uses epochs (32 slots each) for validator duties and finality

const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;

// Convert various slots to epochs
const slots = [0, 1, 31, 32, 33, 63, 64, 96, 100, 1000, 10000];
for (const slotNum of slots) {
	const slot = Slot.from(slotNum);
	const epoch = Slot.toEpoch(slot);
	const positionInEpoch = slotNum % SLOTS_PER_EPOCH;
}
function epochToSlot(epoch: bigint, position: number): bigint {
	return epoch * BigInt(SLOTS_PER_EPOCH) + BigInt(position);
}

const epochs = [0n, 1n, 2n, 10n, 100n, 1000n];
for (const epoch of epochs) {
	const firstSlot = epochToSlot(epoch, 0);
	const lastSlot = epochToSlot(epoch, 31);
}
function isEpochBoundary(slot: bigint): boolean {
	return slot % BigInt(SLOTS_PER_EPOCH) === 0n;
}

const testSlots = [0n, 31n, 32n, 63n, 64n, 100n, 128n];
for (const slotNum of testSlots) {
	const slot = Slot.from(slotNum);
	const boundary = isEpochBoundary(slot);
}
const currentSlot = Slot.from(7234567n);
const currentEpoch = Slot.toEpoch(currentSlot);
const slotInEpoch = Number(currentSlot) % SLOTS_PER_EPOCH;
const slotsRemaining = SLOTS_PER_EPOCH - slotInEpoch;
const progressPct = ((slotInEpoch / SLOTS_PER_EPOCH) * 100).toFixed(1);
const EPOCHS_TO_FINALITY = 2;
const headSlot = Slot.from(7500000n);
const headEpoch = Slot.toEpoch(headSlot);
const finalizedEpoch = headEpoch - BigInt(EPOCHS_TO_FINALITY);
const finalizedSlot = Slot.from(finalizedEpoch * BigInt(SLOTS_PER_EPOCH));
