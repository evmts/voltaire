import * as Slot from "../../../primitives/Slot/index.js";

// Example: Slot ranges and iteration
// Working with ranges of slots for querying and processing

console.log("=== Slot Ranges ===");

// Define a range
const startSlot = Slot.from(7000000n);
const endSlot = Slot.from(7000100n);

console.log("Start slot:", startSlot);
console.log("End slot:", endSlot);
console.log("Range size:", Number(endSlot - startSlot), "slots");

// Iterate through a small range
console.log("\n=== Iterating Slots (first 10) ===");
for (let i = 0; i < 10; i++) {
	const slot = Slot.from(startSlot + BigInt(i));
	const epoch = Slot.toEpoch(slot);
	console.log(`Slot ${slot} (Epoch ${epoch})`);
}

// Epoch-aligned ranges
console.log("\n=== Epoch-Aligned Ranges ===");
const SLOTS_PER_EPOCH = 32;

function getEpochRange(epoch: bigint): { start: bigint; end: bigint } {
	const start = epoch * BigInt(SLOTS_PER_EPOCH);
	const end = start + BigInt(SLOTS_PER_EPOCH) - 1n;
	return { start, end };
}

const epochs = [1000n, 1001n, 1002n];
for (const epoch of epochs) {
	const range = getEpochRange(epoch);
	const startSlot = Slot.from(range.start);
	const endSlot = Slot.from(range.end);
	console.log(
		`Epoch ${epoch}: slots ${startSlot} to ${endSlot} (${SLOTS_PER_EPOCH} slots)`,
	);
}

// Align slot to epoch boundary
console.log("\n=== Align to Epoch Boundary ===");
function alignToEpochStart(slot: bigint): bigint {
	const epoch = slot / BigInt(SLOTS_PER_EPOCH);
	return epoch * BigInt(SLOTS_PER_EPOCH);
}

function alignToEpochEnd(slot: bigint): bigint {
	const epoch = slot / BigInt(SLOTS_PER_EPOCH);
	return (epoch + 1n) * BigInt(SLOTS_PER_EPOCH) - 1n;
}

const testSlots = [7000000n, 7000015n, 7000031n, 7000032n];
for (const slotNum of testSlots) {
	const slot = Slot.from(slotNum);
	const epochStart = Slot.from(alignToEpochStart(slot));
	const epochEnd = Slot.from(alignToEpochEnd(slot));
	console.log(`Slot ${slot} → Epoch range: ${epochStart} to ${epochEnd}`);
}

// Range by time duration
console.log("\n=== Range by Duration ===");
const SECONDS_PER_SLOT = 12;

function slotRange(
	startSlot: bigint,
	durationSeconds: number,
): { start: bigint; end: bigint } {
	const slotsInDuration = Math.floor(durationSeconds / SECONDS_PER_SLOT);
	return {
		start: startSlot,
		end: startSlot + BigInt(slotsInDuration) - 1n,
	};
}

const baseSlot = Slot.from(7500000n);
const durations = [
	{ seconds: 60, label: "1 minute" },
	{ seconds: 600, label: "10 minutes" },
	{ seconds: 3600, label: "1 hour" },
	{ seconds: 86400, label: "1 day" },
];

for (const { seconds, label } of durations) {
	const range = slotRange(baseSlot, seconds);
	const start = Slot.from(range.start);
	const end = Slot.from(range.end);
	const count = Number(range.end - range.start) + 1;
	console.log(`${label.padEnd(12)}: ${start} to ${end} (${count} slots)`);
}

// Missing slots detection
console.log("\n=== Missing Slots Detection ===");
const observedSlots = [
	7600000n,
	7600001n,
	7600002n,
	// 7600003 missing
	7600004n,
	7600005n,
	// 7600006, 7600007 missing
	7600008n,
];

console.log("Observed slots:");
for (let i = 0; i < observedSlots.length - 1; i++) {
	const current = Slot.from(observedSlots[i]);
	const next = Slot.from(observedSlots[i + 1]);
	const gap = Number(next - current) - 1;

	if (gap > 0) {
		console.log(
			`  ${current} → ${next}: ${gap} missing slot${gap > 1 ? "s" : ""}`,
		);
	} else {
		console.log(`  ${current} → ${next}: consecutive`);
	}
}

// Pagination
console.log("\n=== Slot Pagination ===");
const totalSlots = 1000n;
const pageSize = 100;
const startPagination = Slot.from(8000000n);

console.log("Total slots to process:", totalSlots);
console.log("Page size:", pageSize);
console.log("Start slot:", startPagination);

for (let page = 0; page < 5; page++) {
	const pageStart = Slot.from(startPagination + BigInt(page * pageSize));
	const pageEnd = Slot.from(
		startPagination + BigInt((page + 1) * pageSize - 1),
	);
	console.log(`Page ${page}: slots ${pageStart} to ${pageEnd}`);
}

// Slot sampling
console.log("\n=== Slot Sampling (every 10th slot) ===");
const sampleStart = Slot.from(8100000n);
const sampleCount = 10;
const sampleInterval = 10;

for (let i = 0; i < sampleCount; i++) {
	const slot = Slot.from(sampleStart + BigInt(i * sampleInterval));
	const epoch = Slot.toEpoch(slot);
	console.log(`Sample ${i}: Slot ${slot} (Epoch ${epoch})`);
}

// Range intersection
console.log("\n=== Range Intersection ===");
function rangeIntersects(
	a1: bigint,
	a2: bigint,
	b1: bigint,
	b2: bigint,
): boolean {
	return a1 <= b2 && b1 <= a2;
}

function rangeIntersection(
	a1: bigint,
	a2: bigint,
	b1: bigint,
	b2: bigint,
): { start: bigint; end: bigint } | null {
	if (!rangeIntersects(a1, a2, b1, b2)) return null;
	return {
		start: a1 > b1 ? a1 : b1,
		end: a2 < b2 ? a2 : b2,
	};
}

const range1Start = 8200000n;
const range1End = 8200100n;
const range2Start = 8200050n;
const range2End = 8200150n;

console.log(`Range 1: ${range1Start} to ${range1End}`);
console.log(`Range 2: ${range2Start} to ${range2End}`);

const intersection = rangeIntersection(
	range1Start,
	range1End,
	range2Start,
	range2End,
);

if (intersection) {
	const intersectStart = Slot.from(intersection.start);
	const intersectEnd = Slot.from(intersection.end);
	const intersectSize = Number(intersection.end - intersection.start) + 1;
	console.log(
		`Intersection: ${intersectStart} to ${intersectEnd} (${intersectSize} slots)`,
	);
} else {
	console.log("No intersection");
}
