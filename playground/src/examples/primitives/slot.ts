import { Slot } from "@tevm/voltaire";
// Example: Slot basics - Consensus layer slot numbers
// Slots are the fundamental unit of time in Ethereum's proof-of-stake consensus
// Each slot is 12 seconds, and 32 slots form one epoch

// Create slots using various input types
const genesisSlot = Slot(0);
const slot1M = Slot(1000000);
const slotFromBigInt = Slot(7000000n);
const slotFromHex = Slot("0xf4240"); // 1000000
const slotFromString = Slot("5000000");

// Epoch boundaries (32 slots per epoch)
const epochBoundaries = [
	Slot(0), // Epoch 0, slot 0
	Slot(32), // Epoch 1, slot 0
	Slot(64), // Epoch 2, slot 0
	Slot(96), // Epoch 3, slot 0
];
for (const slot of epochBoundaries) {
	const epoch = Slot.toEpoch(slot);
}
const slotsInEpoch = [
	Slot(32), // First slot of epoch 1
	Slot(33), // Second slot of epoch 1
	Slot(40), // Middle of epoch 1
	Slot(63), // Last slot of epoch 1
	Slot(64), // First slot of epoch 2
];

for (const slot of slotsInEpoch) {
	const epoch = Slot.toEpoch(slot);
	const slotInEpoch = Number(slot) % 32;
}
const currentSlot = Slot(7000000n);
const nextSlot = Slot(7000001n);
const prevSlot = Slot(6999999n);
const slotA = Slot(1000000n);
const slotB = Slot(1000000n);
const slotC = Slot(1000001n);
const realisticSlots = [
	{ slot: Slot(7000000n), label: "~Mid 2024" },
	{ slot: Slot(7500000n), label: "~Late 2024" },
	{ slot: Slot(8000000n), label: "~Early 2025" },
];

for (const { slot, label } of realisticSlots) {
	const epoch = Slot.toEpoch(slot);
}
