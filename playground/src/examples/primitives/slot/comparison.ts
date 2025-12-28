import { Slot } from "voltaire";
const slotA = Slot.from(1000000n);
const slotB = Slot.from(1000000n);
const slotC = Slot.from(1000001n);
const slots = [
	Slot.from(7000000n),
	Slot.from(7000005n),
	Slot.from(7000002n),
	Slot.from(7000010n),
	Slot.from(7000001n),
];
for (const slot of slots) {
}
const unsorted = [
	Slot.from(7500000n),
	Slot.from(7499995n),
	Slot.from(7500010n),
	Slot.from(7499990n),
	Slot.from(7500005n),
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
	Slot.from(8000000n),
	Slot.from(8000100n),
	Slot.from(8000050n),
	Slot.from(8000025n),
	Slot.from(8000075n),
];

const minSlot = slotSet.reduce((min, slot) => (slot < min ? slot : min));
const maxSlot = slotSet.reduce((max, slot) => (slot > max ? slot : max));
const searchSlots = [
	Slot.from(8100000n),
	Slot.from(8100032n),
	Slot.from(8100064n),
	Slot.from(8100096n),
	Slot.from(8100128n),
];

const target = Slot.from(8100064n);
const found = searchSlots.find((slot) => Slot.equals(slot, target));

const index = searchSlots.findIndex((slot) => Slot.equals(slot, target));
const filterSlots = [
	Slot.from(8200000n),
	Slot.from(8200001n),
	Slot.from(8200032n),
	Slot.from(8200033n),
	Slot.from(8200064n),
	Slot.from(8200065n),
	Slot.from(8200096n),
];

const SLOTS_PER_EPOCH = 32;

// Filter epoch boundaries
const epochBoundaries = filterSlots.filter(
	(slot) => slot % BigInt(SLOTS_PER_EPOCH) === 0n,
);
for (const slot of epochBoundaries) {
	const epoch = Slot.toEpoch(slot);
}
const threshold = Slot.from(8300000n);
const above = [
	Slot.from(8299990n),
	Slot.from(8300000n),
	Slot.from(8300001n),
	Slot.from(8300010n),
].filter((slot) => slot >= threshold);
for (const slot of above) {
}
const duplicates = [
	Slot.from(8400000n),
	Slot.from(8400001n),
	Slot.from(8400000n), // duplicate
	Slot.from(8400002n),
	Slot.from(8400001n), // duplicate
	Slot.from(8400003n),
];
for (const slot of duplicates) {
}

const unique = duplicates.filter(
	(slot, index, array) =>
		array.findIndex((s) => Slot.equals(s, slot)) === index,
);
for (const slot of unique) {
}
const setA = [
	Slot.from(8500000n),
	Slot.from(8500001n),
	Slot.from(8500002n),
	Slot.from(8500003n),
];

const setB = [
	Slot.from(8500002n),
	Slot.from(8500003n),
	Slot.from(8500004n),
	Slot.from(8500005n),
];

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
	Slot.from(8600000n),
	Slot.from(8600010n),
	Slot.from(8600020n),
	Slot.from(8600030n),
	Slot.from(8600040n),
];

const reference = Slot.from(8600022n);

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
