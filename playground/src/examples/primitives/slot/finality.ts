import * as Slot from "../../../primitives/Slot/index.js";

// Example: Finality and checkpoints
// Ethereum PoS uses Casper FFG for finality with justified and finalized checkpoints

const SLOTS_PER_EPOCH = 32;

console.log("=== Finality Basics ===");
console.log("Slots per epoch:", SLOTS_PER_EPOCH);
console.log("Finality requires: 2 consecutive justified epochs");
console.log("Checkpoint: First slot of an epoch\n");

// Finality demonstration
console.log("=== Finality Example ===");
const headSlot = Slot.from(7890456n);
const headEpoch = Slot.toEpoch(headSlot);

// Justified checkpoint (1 epoch back)
const justifiedEpoch = headEpoch - 1n;
const justifiedSlot = Slot.from(justifiedEpoch * BigInt(SLOTS_PER_EPOCH));

// Finalized checkpoint (2 epochs back)
const finalizedEpoch = headEpoch - 2n;
const finalizedSlot = Slot.from(finalizedEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Head slot:", headSlot);
console.log("Head epoch:", headEpoch);
console.log("");
console.log("Justified checkpoint:");
console.log("  Epoch:", justifiedEpoch);
console.log("  Slot:", justifiedSlot);
console.log("");
console.log("Finalized checkpoint:");
console.log("  Epoch:", finalizedEpoch);
console.log("  Slot:", finalizedSlot);
console.log("");
console.log("Distance from head to finalized:");
console.log("  Epochs:", headEpoch - finalizedEpoch);
console.log("  Slots:", Number(headSlot - finalizedSlot));

// Checkpoint progression
console.log("\n=== Checkpoint Progression ===");
function getCheckpoint(epoch: bigint): bigint {
	// Checkpoint is the first slot of the epoch
	return epoch * BigInt(SLOTS_PER_EPOCH);
}

const epochs = [100n, 101n, 102n, 103n, 104n];
for (const epoch of epochs) {
	const checkpointSlot = Slot.from(getCheckpoint(epoch));
	console.log(`Epoch ${epoch}: Checkpoint at slot ${checkpointSlot}`);
}

// Finality delay scenarios
console.log("\n=== Finality Delay Scenarios ===");

// Normal finality (2 epochs)
const normalHead = Slot.from(8000000n);
const normalHeadEpoch = Slot.toEpoch(normalHead);
const normalFinalized = normalHeadEpoch - 2n;
const normalDelay = normalHeadEpoch - normalFinalized;

console.log("Normal finality:");
console.log("  Head epoch:", normalHeadEpoch);
console.log("  Finalized epoch:", normalFinalized);
console.log("  Delay:", normalDelay, "epochs (HEALTHY)");

// Delayed finality (network issues)
const delayedHead = Slot.from(8100000n);
const delayedHeadEpoch = Slot.toEpoch(delayedHead);
const delayedFinalized = delayedHeadEpoch - 5n;
const delayedGap = delayedHeadEpoch - delayedFinalized;

console.log("\nDelayed finality:");
console.log("  Head epoch:", delayedHeadEpoch);
console.log("  Finalized epoch:", delayedFinalized);
console.log("  Delay:", delayedGap, "epochs (WARNING)");

// Critical delay
const criticalHead = Slot.from(8200000n);
const criticalHeadEpoch = Slot.toEpoch(criticalHead);
const criticalFinalized = criticalHeadEpoch - 10n;
const criticalGap = criticalHeadEpoch - criticalFinalized;

console.log("\nCritical delay:");
console.log("  Head epoch:", criticalHeadEpoch);
console.log("  Finalized epoch:", criticalFinalized);
console.log("  Delay:", criticalGap, "epochs (CRITICAL)");

// Weak subjectivity period
console.log("\n=== Weak Subjectivity Period ===");
const MIN_VALIDATOR_WITHDRAWAL_DELAY = 256; // epochs
const WEAK_SUBJECTIVITY_PERIOD = MIN_VALIDATOR_WITHDRAWAL_DELAY * 2; // ~36 days

const currentCheckpoint = Slot.from(8300000n);
const currentCheckpointEpoch = Slot.toEpoch(currentCheckpoint);
const weakSubjectivityEpoch =
	currentCheckpointEpoch + BigInt(WEAK_SUBJECTIVITY_PERIOD);
const weakSubjectivitySlot = Slot.from(
	weakSubjectivityEpoch * BigInt(SLOTS_PER_EPOCH),
);

console.log("Current checkpoint:", currentCheckpoint);
console.log("Current epoch:", currentCheckpointEpoch);
console.log("Weak subjectivity period:", WEAK_SUBJECTIVITY_PERIOD, "epochs");
console.log("Weak subjectivity boundary epoch:", weakSubjectivityEpoch);
console.log("Weak subjectivity boundary slot:", weakSubjectivitySlot);
console.log(
	"Must sync within:",
	WEAK_SUBJECTIVITY_PERIOD,
	"epochs (~",
	(WEAK_SUBJECTIVITY_PERIOD * 32 * 12) / 86400,
	"days)",
);

// Reorg protection
console.log("\n=== Reorg Protection ===");
const reorgHead = Slot.from(8400000n);
const reorgHeadEpoch = Slot.toEpoch(reorgHead);
const safeSlot = Slot.from((reorgHeadEpoch - 1n) * BigInt(SLOTS_PER_EPOCH)); // 1 epoch back
const finalizedReorgSlot = Slot.from(
	(reorgHeadEpoch - 2n) * BigInt(SLOTS_PER_EPOCH),
); // 2 epochs back

console.log("Current head:", reorgHead);
console.log("Head epoch:", reorgHeadEpoch);
console.log("");
console.log("Safe head (1 epoch back):");
console.log("  Slot:", safeSlot);
console.log("  Reorg risk: LOW");
console.log("");
console.log("Finalized head (2 epochs back):");
console.log("  Slot:", finalizedReorgSlot);
console.log("  Reorg risk: NONE (finalized)");

// Supermajority voting
console.log("\n=== Supermajority Voting ===");
const votingEpoch = 9000n;
const votingSlot = Slot.from(votingEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Voting epoch:", votingEpoch);
console.log("Voting slot:", votingSlot);
console.log("Required for justification: 2/3 supermajority");
console.log("Required for finalization: 2 consecutive justified epochs");
console.log("");
console.log("Epoch N justified → Epoch N-1 finalized");
console.log("(when N-1 was already justified)");

// Checkpoint states
console.log("\n=== Checkpoint State Transitions ===");
const stateEpoch = 10000n;

console.log(`Epoch ${stateEpoch}:`);
console.log(`  Slot ${stateEpoch * BigInt(SLOTS_PER_EPOCH)}: PROPOSED`);
console.log(`  + 2/3 attestations: JUSTIFIED`);
console.log(`Epoch ${stateEpoch + 1n}:`);
console.log(`  Slot ${(stateEpoch + 1n) * BigInt(SLOTS_PER_EPOCH)}: PROPOSED`);
console.log(`  + 2/3 attestations: JUSTIFIED`);
console.log(`  → Epoch ${stateEpoch} becomes: FINALIZED`);
