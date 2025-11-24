import * as Slot from "../../../primitives/Slot/index.js";

// Example: Network conditions and slot processing
// Analyzing network health through slot metrics

const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;

console.log("=== Network Health Monitoring ===");

// Slot participation rate
console.log("\n=== Slot Participation ===");
const monitorEpoch = 5000n;
const epochSlots: Array<{ slot: bigint; proposed: boolean }> = [];

// Simulate an epoch with some missed slots
for (let i = 0; i < SLOTS_PER_EPOCH; i++) {
	const slotNum = monitorEpoch * BigInt(SLOTS_PER_EPOCH) + BigInt(i);
	// Randomly miss some slots (90% success rate)
	const proposed = Math.random() > 0.1;
	epochSlots.push({ slot: slotNum, proposed });
}

let proposedCount = 0;
let missedCount = 0;

console.log(`Epoch ${monitorEpoch}:`);
for (const { slot, proposed } of epochSlots.slice(0, 10)) {
	const slotObj = Slot.from(slot);
	console.log(`  Slot ${slotObj}: ${proposed ? "✓ PROPOSED" : "✗ MISSED"}`);
	if (proposed) proposedCount++;
	else missedCount++;
}
console.log("  ... (showing first 10)");

// Calculate full epoch stats
for (const { proposed } of epochSlots) {
	if (proposed) proposedCount++;
	else missedCount++;
}

const participationRate = (proposedCount / SLOTS_PER_EPOCH) * 100;
console.log(`\nProposed: ${proposedCount}/${SLOTS_PER_EPOCH}`);
console.log(`Missed: ${missedCount}/${SLOTS_PER_EPOCH}`);
console.log(`Participation rate: ${participationRate.toFixed(1)}%`);

// Network sync status
console.log("\n=== Network Sync Status ===");
const networkHead = Slot.from(8500000n);
const localHead = Slot.from(8499850n);
const slotsBehind = Number(networkHead - localHead);

console.log("Network head:", networkHead);
console.log("Local head:", localHead);
console.log("Slots behind:", slotsBehind);
console.log("Time behind:", slotsBehind * SECONDS_PER_SLOT, "seconds");

if (slotsBehind === 0) {
	console.log("Status: SYNCED");
} else if (slotsBehind < 32) {
	console.log("Status: NEARLY SYNCED");
} else if (slotsBehind < 320) {
	console.log("Status: SYNCING");
} else {
	console.log("Status: FAR BEHIND");
}

// Attestation inclusion delay
console.log("\n=== Attestation Inclusion Delay ===");
const attestationSlot = Slot.from(8600000n);
const inclusionSlots = [
	Slot.from(8600001n), // +1 (optimal)
	Slot.from(8600001n), // +1 (optimal)
	Slot.from(8600002n), // +2
	Slot.from(8600001n), // +1 (optimal)
	Slot.from(8600003n), // +3
];

console.log("Attestation slot:", attestationSlot);
console.log("\nInclusion delays:");

let totalDelay = 0;
for (let i = 0; i < inclusionSlots.length; i++) {
	const delay = Number(inclusionSlots[i] - attestationSlot);
	totalDelay += delay;
	const status = delay === 1 ? "OPTIMAL" : "DELAYED";
	console.log(`  Validator ${i}: +${delay} slots (${status})`);
}

const avgDelay = totalDelay / inclusionSlots.length;
console.log(`\nAverage inclusion delay: ${avgDelay.toFixed(2)} slots`);

// Fork choice delays
console.log("\n=== Fork Choice Delays ===");
const forkSlot = Slot.from(8700000n);
const forkEpoch = Slot.toEpoch(forkSlot);

console.log("Fork detected at slot:", forkSlot);
console.log("Fork epoch:", forkEpoch);

const branch1Head = Slot.from(8700005n);
const branch2Head = Slot.from(8700004n);

console.log(
	"\nBranch 1 head:",
	branch1Head,
	"(length:",
	Number(branch1Head - forkSlot),
	")",
);
console.log(
	"Branch 2 head:",
	branch2Head,
	"(length:",
	Number(branch2Head - forkSlot),
	")",
);

const canonicalHead = branch1Head > branch2Head ? branch1Head : branch2Head;
console.log("Canonical head:", canonicalHead, "(longest chain)");

// Reorg detection
console.log("\n=== Reorg Detection ===");
const headBeforeReorg = Slot.from(8800100n);
const headAfterReorg = Slot.from(8800095n); // Moved back 5 slots

console.log("Head before:", headBeforeReorg);
console.log("Head after:", headAfterReorg);

if (headAfterReorg < headBeforeReorg) {
	const reorgDepth = Number(headBeforeReorg - headAfterReorg);
	console.log(`REORG DETECTED: ${reorgDepth} slots deep`);

	if (reorgDepth === 1) {
		console.log("Severity: MINOR (1 slot)");
	} else if (reorgDepth < 32) {
		console.log("Severity: MODERATE (<1 epoch)");
	} else {
		console.log("Severity: MAJOR (≥1 epoch)");
	}
}

// Slot processing time
console.log("\n=== Slot Processing Time ===");
const processSlots = [
	{ slot: 8900000n, processTimeMs: 250 },
	{ slot: 8900001n, processTimeMs: 180 },
	{ slot: 8900002n, processTimeMs: 4000 }, // Slow
	{ slot: 8900003n, processTimeMs: 220 },
	{ slot: 8900004n, processTimeMs: 190 },
];

console.log("Processing times:");
for (const { slot, processTimeMs } of processSlots) {
	const slotObj = Slot.from(slot);
	const status = processTimeMs < 1000 ? "FAST" : "SLOW";
	console.log(`  Slot ${slotObj}: ${processTimeMs}ms (${status})`);
}

const avgProcessTime =
	processSlots.reduce((sum, { processTimeMs }) => sum + processTimeMs, 0) /
	processSlots.length;
console.log(`\nAverage processing time: ${avgProcessTime.toFixed(0)}ms`);

// Network propagation
console.log("\n=== Block Propagation ===");
const propSlot = Slot.from(9000000n);
const propTimes = [
	{ peer: "A", delayMs: 50 },
	{ peer: "B", delayMs: 120 },
	{ peer: "C", delayMs: 85 },
	{ peer: "D", delayMs: 200 },
	{ peer: "E", delayMs: 95 },
];

console.log(`Block at slot ${propSlot} propagation:`);
for (const { peer, delayMs } of propTimes) {
	const percent = ((delayMs / SECONDS_PER_SLOT / 1000) * 100).toFixed(1);
	console.log(`  Peer ${peer}: ${delayMs}ms (${percent}% of slot)`);
}

const avgPropTime =
	propTimes.reduce((sum, { delayMs }) => sum + delayMs, 0) / propTimes.length;
console.log(`\nAverage propagation: ${avgPropTime.toFixed(0)}ms`);

// Slot timeliness
console.log("\n=== Slot Timeliness ===");
const targetSlot = Slot.from(9100000n);
const timelyAttestations = 28; // out of 32 possible

console.log(`Slot ${targetSlot}:`);
console.log(`Timely attestations: ${timelyAttestations}/32`);
console.log(`Timeliness: ${((timelyAttestations / 32) * 100).toFixed(1)}%`);

if (timelyAttestations >= 30) {
	console.log("Status: EXCELLENT");
} else if (timelyAttestations >= 26) {
	console.log("Status: GOOD");
} else if (timelyAttestations >= 22) {
	console.log("Status: FAIR");
} else {
	console.log("Status: POOR");
}
