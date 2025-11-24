import * as Slot from "../../../primitives/Slot/index.js";

// Example: Slot comparison and sorting
// Working with multiple slots and ordering

console.log("=== Slot Comparison ===");

// Basic equality
console.log("\n=== Equality ===");
const slotA = Slot.from(1000000n);
const slotB = Slot.from(1000000n);
const slotC = Slot.from(1000001n);

console.log("slotA:", slotA);
console.log("slotB:", slotB);
console.log("slotC:", slotC);
console.log("");
console.log("slotA === slotB:", slotA === slotB);
console.log("Slot.equals(slotA, slotB):", Slot.equals(slotA, slotB));
console.log("Slot.equals(slotA, slotC):", Slot.equals(slotA, slotC));

// Ordering
console.log("\n=== Ordering ===");
const slots = [
	Slot.from(7000000n),
	Slot.from(7000005n),
	Slot.from(7000002n),
	Slot.from(7000010n),
	Slot.from(7000001n),
];

console.log("Original order:");
for (const slot of slots) {
	console.log(`  ${slot}`);
}

console.log("\nComparisons:");
console.log(`  ${slots[0]} < ${slots[1]}:`, slots[0] < slots[1]);
console.log(`  ${slots[0]} > ${slots[1]}:`, slots[0] > slots[1]);
console.log(`  ${slots[1]} < ${slots[2]}:`, slots[1] < slots[2]);
console.log(`  ${slots[1]} > ${slots[2]}:`, slots[1] > slots[2]);

// Sorting
console.log("\n=== Sorting ===");
const unsorted = [
	Slot.from(7500000n),
	Slot.from(7499995n),
	Slot.from(7500010n),
	Slot.from(7499990n),
	Slot.from(7500005n),
];

console.log("Unsorted:");
for (const slot of unsorted) {
	console.log(`  ${slot}`);
}

const sorted = [...unsorted].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

console.log("\nSorted (ascending):");
for (const slot of sorted) {
	console.log(`  ${slot}`);
}

const sortedDesc = [...unsorted].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));

console.log("\nSorted (descending):");
for (const slot of sortedDesc) {
	console.log(`  ${slot}`);
}

// Min/Max
console.log("\n=== Min/Max ===");
const slotSet = [
	Slot.from(8000000n),
	Slot.from(8000100n),
	Slot.from(8000050n),
	Slot.from(8000025n),
	Slot.from(8000075n),
];

const minSlot = slotSet.reduce((min, slot) => (slot < min ? slot : min));
const maxSlot = slotSet.reduce((max, slot) => (slot > max ? slot : max));

console.log("Slots:", slotSet.map((s) => s.toString()).join(", "));
console.log("Min:", minSlot);
console.log("Max:", maxSlot);
console.log("Range:", Number(maxSlot - minSlot), "slots");

// Find operations
console.log("\n=== Find Operations ===");
const searchSlots = [
	Slot.from(8100000n),
	Slot.from(8100032n),
	Slot.from(8100064n),
	Slot.from(8100096n),
	Slot.from(8100128n),
];

const target = Slot.from(8100064n);
const found = searchSlots.find((slot) => Slot.equals(slot, target));

console.log("Searching for:", target);
console.log("Found:", found !== undefined ? found : "not found");

const index = searchSlots.findIndex((slot) => Slot.equals(slot, target));
console.log("Index:", index);

// Filter operations
console.log("\n=== Filter Operations ===");
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

console.log("All slots:", filterSlots.length);
console.log("Epoch boundaries:", epochBoundaries.length);
for (const slot of epochBoundaries) {
	const epoch = Slot.toEpoch(slot);
	console.log(`  ${slot} (Epoch ${epoch})`);
}

// Greater than threshold
console.log("\n=== Threshold Filtering ===");
const threshold = Slot.from(8300000n);
const above = [
	Slot.from(8299990n),
	Slot.from(8300000n),
	Slot.from(8300001n),
	Slot.from(8300010n),
].filter((slot) => slot >= threshold);

console.log("Threshold:", threshold);
console.log("Slots >= threshold:");
for (const slot of above) {
	console.log(`  ${slot}`);
}

// Deduplication
console.log("\n=== Deduplication ===");
const duplicates = [
	Slot.from(8400000n),
	Slot.from(8400001n),
	Slot.from(8400000n), // duplicate
	Slot.from(8400002n),
	Slot.from(8400001n), // duplicate
	Slot.from(8400003n),
];

console.log("With duplicates:", duplicates.length);
for (const slot of duplicates) {
	console.log(`  ${slot}`);
}

const unique = duplicates.filter(
	(slot, index, array) =>
		array.findIndex((s) => Slot.equals(s, slot)) === index,
);

console.log("\nUnique:", unique.length);
for (const slot of unique) {
	console.log(`  ${slot}`);
}

// Set operations (union, intersection, difference)
console.log("\n=== Set Operations ===");
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

console.log("Set A:", setA.map((s) => s.toString()).join(", "));
console.log("Set B:", setB.map((s) => s.toString()).join(", "));

// Union
const union = [...setA, ...setB].filter(
	(slot, index, array) =>
		array.findIndex((s) => Slot.equals(s, slot)) === index,
);
console.log("\nUnion:", union.map((s) => s.toString()).join(", "));

// Intersection
const intersection = setA.filter((slotA) =>
	setB.some((slotB) => Slot.equals(slotA, slotB)),
);
console.log("Intersection:", intersection.map((s) => s.toString()).join(", "));

// Difference (A - B)
const difference = setA.filter(
	(slotA) => !setB.some((slotB) => Slot.equals(slotA, slotB)),
);
console.log(
	"Difference (A-B):",
	difference.map((s) => s.toString()).join(", "),
);

// Nearest slot
console.log("\n=== Nearest Slot ===");
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

console.log("Reference:", reference);
console.log("Candidates:", candidates.map((s) => s.toString()).join(", "));
console.log("Nearest:", nearest, `(distance: ${minDistance})`);
