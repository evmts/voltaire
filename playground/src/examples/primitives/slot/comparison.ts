import { Slot } from "@tevm/voltaire";
const slotA = Slot(1000000n);
const slotB = Slot(1000000n);
const slotC = Slot(1000001n);
const slots = [
	Slot(7000000n),
	Slot(7000005n),
	Slot(7000002n),
	Slot(7000010n),
	Slot(7000001n),
];
for (const slot of slots) {
}
const unsorted = [
	Slot(7500000n),
	Slot(7499995n),
	Slot(7500010n),
	Slot(7499990n),
	Slot(7500005n),
];
for (const slot of unsorted) {
}

const sorted = [...unsorted].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
for (const slot of sorted) {
}

const sortedDesc = [...unsorted].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
for (const slot of sortedDesc) {
}
const slotSet = [
	Slot(8000000n),
	Slot(8000100n),
	Slot(8000050n),
	Slot(8000025n),
	Slot(8000075n),
];

const minSlot = slotSet.reduce((min, slot) => (slot < min ? slot : min));
const maxSlot = slotSet.reduce((max, slot) => (slot > max ? slot : max));
const searchSlots = [
	Slot(8100000n),
	Slot(8100032n),
	Slot(8100064n),
	Slot(8100096n),
	Slot(8100128n),
];

const target = Slot(8100064n);
const found = searchSlots.find((slot) => Slot.equals(slot, target));

const index = searchSlots.findIndex((slot) => Slot.equals(slot, target));
const filterSlots = [
	Slot(8200000n),
	Slot(8200001n),
	Slot(8200032n),
	Slot(8200033n),
	Slot(8200064n),
	Slot(8200065n),
	Slot(8200096n),
];

const SLOTS_PER_EPOCH = 32;

// Filter epoch boundaries
const epochBoundaries = filterSlots.filter(
	(slot) => slot % BigInt(SLOTS_PER_EPOCH) === 0n,
);
for (const slot of epochBoundaries) {
	const epoch = Slot.toEpoch(slot);
}
const threshold = Slot(8300000n);
const above = [
	Slot(8299990n),
	Slot(8300000n),
	Slot(8300001n),
	Slot(8300010n),
].filter((slot) => slot >= threshold);
for (const slot of above) {
}
const duplicates = [
	Slot(8400000n),
	Slot(8400001n),
	Slot(8400000n), // duplicate
	Slot(8400002n),
	Slot(8400001n), // duplicate
	Slot(8400003n),
];
for (const slot of duplicates) {
}

const unique = duplicates.filter(
	(slot, index, array) =>
		array.findIndex((s) => Slot.equals(s, slot)) === index,
);
for (const slot of unique) {
}
const setA = [Slot(8500000n), Slot(8500001n), Slot(8500002n), Slot(8500003n)];

const setB = [Slot(8500002n), Slot(8500003n), Slot(8500004n), Slot(8500005n)];

// Union
const union = [...setA, ...setB].filter(
	(slot, index, array) =>
		array.findIndex((s) => Slot.equals(s, slot)) === index,
);

// Intersection
const intersection = setA.filter((slotA) =>
	setB.some((slotB) => Slot.equals(slotA, slotB)),
);

// Difference (A - B)
const difference = setA.filter(
	(slotA) => !setB.some((slotB) => Slot.equals(slotA, slotB)),
);
const candidates = [
	Slot(8600000n),
	Slot(8600010n),
	Slot(8600020n),
	Slot(8600030n),
	Slot(8600040n),
];

const reference = Slot(8600022n);

let nearest = candidates[0];
let minDistance =
	reference > nearest ? reference - nearest : nearest - reference;

for (const candidate of candidates) {
	const distance =
		reference > candidate ? reference - candidate : candidate - reference;
	if (distance < minDistance) {
		minDistance = distance;
		nearest = candidate;
	}
}
