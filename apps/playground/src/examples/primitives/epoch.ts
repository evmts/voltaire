import { } from "@tevm/voltaire";

// Epoch: Beacon chain time periods
// An epoch is 32 slots, each slot is 12 seconds (384 seconds total)

const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;
const SECONDS_PER_EPOCH = SLOTS_PER_EPOCH * SECONDS_PER_SLOT;

console.log("Epoch constants:");
console.log("  Slots per epoch:", SLOTS_PER_EPOCH);
console.log("  Seconds per slot:", SECONDS_PER_SLOT);
console.log("  Seconds per epoch:", SECONDS_PER_EPOCH);
console.log("  Minutes per epoch:", SECONDS_PER_EPOCH / 60);

// Calculate epoch from slot
function slotToEpoch(slot: bigint): bigint {
	return slot / BigInt(SLOTS_PER_EPOCH);
}

// Calculate first slot of epoch
function epochToSlot(epoch: bigint): bigint {
	return epoch * BigInt(SLOTS_PER_EPOCH);
}

// Example calculations
const currentSlot = 8000000n; // Example slot
const currentEpoch = slotToEpoch(currentSlot);
console.log("\nSlot/Epoch conversion:");
console.log("  Slot:", currentSlot);
console.log("  Epoch:", currentEpoch);
console.log("  First slot of epoch:", epochToSlot(currentEpoch));

// Beacon chain genesis (Dec 1, 2020)
const GENESIS_TIME = 1606824023;
const genesisDate = new Date(GENESIS_TIME * 1000);
console.log("\nBeacon chain genesis:", genesisDate.toISOString());

// Calculate current epoch from timestamp
function timestampToEpoch(timestamp: number): bigint {
	const slot = BigInt(Math.floor((timestamp - GENESIS_TIME) / SECONDS_PER_SLOT));
	return slotToEpoch(slot);
}

const now = Math.floor(Date.now() / 1000);
const estimatedEpoch = timestampToEpoch(now);
console.log("Estimated current epoch:", estimatedEpoch);

// Epoch boundaries are important for:
const epochImportance = {
	finality: "Epochs finalize after 2 epochs (~13 min)",
	rewards: "Validator rewards calculated per epoch",
	shuffling: "Committee assignments change each epoch",
	slashing: "Slashing applies at epoch boundaries",
};

console.log("\nEpoch significance:");
Object.entries(epochImportance).forEach(([key, desc]) => {
	console.log(`  ${key}: ${desc}`);
});

// Epochs since merge (Sep 15, 2022)
const MERGE_EPOCH = 144896n;
const epochsSinceMerge = estimatedEpoch - MERGE_EPOCH;
console.log("\nEpochs since merge:", epochsSinceMerge);
console.log("Days since merge:", Number(epochsSinceMerge) * SECONDS_PER_EPOCH / 86400);
