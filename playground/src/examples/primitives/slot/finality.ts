import { Slot } from "voltaire";
// Example: Finality and checkpoints
// Ethereum PoS uses Casper FFG for finality with justified and finalized checkpoints

const SLOTS_PER_EPOCH = 32;
const headSlot = Slot.from(7890456n);
const headEpoch = Slot.toEpoch(headSlot);

// Justified checkpoint (1 epoch back)
const justifiedEpoch = headEpoch - 1n;
const justifiedSlot = Slot.from(justifiedEpoch * BigInt(SLOTS_PER_EPOCH));

// Finalized checkpoint (2 epochs back)
const finalizedEpoch = headEpoch - 2n;
const finalizedSlot = Slot.from(finalizedEpoch * BigInt(SLOTS_PER_EPOCH));
function getCheckpoint(epoch: bigint): bigint {
	// Checkpoint is the first slot of the epoch
	return epoch * BigInt(SLOTS_PER_EPOCH);
}

const epochs = [100n, 101n, 102n, 103n, 104n];
for (const epoch of epochs) {
	const checkpointSlot = Slot.from(getCheckpoint(epoch));
}

// Normal finality (2 epochs)
const normalHead = Slot.from(8000000n);
const normalHeadEpoch = Slot.toEpoch(normalHead);
const normalFinalized = normalHeadEpoch - 2n;
const normalDelay = normalHeadEpoch - normalFinalized;

// Delayed finality (network issues)
const delayedHead = Slot.from(8100000n);
const delayedHeadEpoch = Slot.toEpoch(delayedHead);
const delayedFinalized = delayedHeadEpoch - 5n;
const delayedGap = delayedHeadEpoch - delayedFinalized;

// Critical delay
const criticalHead = Slot.from(8200000n);
const criticalHeadEpoch = Slot.toEpoch(criticalHead);
const criticalFinalized = criticalHeadEpoch - 10n;
const criticalGap = criticalHeadEpoch - criticalFinalized;
const MIN_VALIDATOR_WITHDRAWAL_DELAY = 256; // epochs
const WEAK_SUBJECTIVITY_PERIOD = MIN_VALIDATOR_WITHDRAWAL_DELAY * 2; // ~36 days

const currentCheckpoint = Slot.from(8300000n);
const currentCheckpointEpoch = Slot.toEpoch(currentCheckpoint);
const weakSubjectivityEpoch =
	currentCheckpointEpoch + BigInt(WEAK_SUBJECTIVITY_PERIOD);
const weakSubjectivitySlot = Slot.from(
	weakSubjectivityEpoch * BigInt(SLOTS_PER_EPOCH),
);
const reorgHead = Slot.from(8400000n);
const reorgHeadEpoch = Slot.toEpoch(reorgHead);
const safeSlot = Slot.from((reorgHeadEpoch - 1n) * BigInt(SLOTS_PER_EPOCH)); // 1 epoch back
const finalizedReorgSlot = Slot.from(
	(reorgHeadEpoch - 2n) * BigInt(SLOTS_PER_EPOCH),
); // 2 epochs back
const votingEpoch = 9000n;
const votingSlot = Slot.from(votingEpoch * BigInt(SLOTS_PER_EPOCH));
const stateEpoch = 10000n;
