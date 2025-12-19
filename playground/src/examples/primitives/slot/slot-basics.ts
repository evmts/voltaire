import * as Slot from "../../../primitives/Slot/index.js";

// Example: Slot basics - Consensus layer slot numbers
// Slots are the fundamental unit of time in Ethereum's proof-of-stake consensus
// Each slot is 12 seconds, and 32 slots form one epoch

// Create slots using various input types
const genesisSlot = Slot.from(0);
const slot1M = Slot.from(1000000);
const slotFromBigInt = Slot.from(7000000n);
const slotFromHex = Slot.from("0xf4240"); // 1000000
const slotFromString = Slot.from("5000000");

// Epoch boundaries (32 slots per epoch)
const epochBoundaries = [
	Slot.from(0), // Epoch 0, slot 0
	Slot.from(32), // Epoch 1, slot 0
	Slot.from(64), // Epoch 2, slot 0
	Slot.from(96), // Epoch 3, slot 0
];
for (const slot of epochBoundaries) {
	const epoch = Slot.toEpoch(slot);
}
const slotsInEpoch = [
	Slot.from(32), // First slot of epoch 1
	Slot.from(33), // Second slot of epoch 1
	Slot.from(40), // Middle of epoch 1
	Slot.from(63), // Last slot of epoch 1
	Slot.from(64), // First slot of epoch 2
];

for (const slot of slotsInEpoch) {
	const epoch = Slot.toEpoch(slot);
	const slotInEpoch = Number(slot) % 32;
}
const currentSlot = Slot.from(7000000n);
const nextSlot = Slot.from(7000001n);
const prevSlot = Slot.from(6999999n);
const slotA = Slot.from(1000000n);
const slotB = Slot.from(1000000n);
const slotC = Slot.from(1000001n);
const realisticSlots = [
	{ slot: Slot.from(7000000n), label: "~Mid 2024" },
	{ slot: Slot.from(7500000n), label: "~Late 2024" },
	{ slot: Slot.from(8000000n), label: "~Early 2025" },
];

for (const { slot, label } of realisticSlots) {
	const epoch = Slot.toEpoch(slot);
}
