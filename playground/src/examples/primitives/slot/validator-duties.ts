import * as Slot from "../../../primitives/Slot/index.js";

// Example: Validator duty scheduling
// Validators are assigned duties based on slots and epochs

const SLOTS_PER_EPOCH = 32;

console.log("=== Validator Duty Scheduling ===");

// Attestation slots (every slot in an epoch)
console.log("\n=== Attestation Slots (Epoch 1000) ===");
const epoch = 1000n;
const firstSlot = epoch * BigInt(SLOTS_PER_EPOCH);

for (let i = 0; i < 8; i++) {
	const slot = Slot.from(firstSlot + BigInt(i));
	const slotEpoch = Slot.toEpoch(slot);
	const position = Number(slot) % SLOTS_PER_EPOCH;
	console.log(
		`Slot ${slot} (Epoch ${slotEpoch}, pos ${position}): Attestation duty`,
	);
}

console.log("... (24 more slots)");

// Block proposal slots (example validator assigned to slots 2, 17, 29)
console.log("\n=== Block Proposal Slots (Example Validator) ===");
const proposalPositions = [2, 17, 29];
const proposalEpoch = 1500n;

for (const position of proposalPositions) {
	const slot = Slot.from(
		proposalEpoch * BigInt(SLOTS_PER_EPOCH) + BigInt(position),
	);
	const slotEpoch = Slot.toEpoch(slot);
	console.log(
		`Slot ${slot} (Epoch ${slotEpoch}, pos ${position}): BLOCK PROPOSAL`,
	);
}

// Sync committee duties (every slot for 256 epochs)
console.log("\n=== Sync Committee Period ===");
const EPOCHS_PER_SYNC_COMMITTEE = 256;
const syncCommitteeStartEpoch = 2000n;
const syncCommitteeEndEpoch =
	syncCommitteeStartEpoch + BigInt(EPOCHS_PER_SYNC_COMMITTEE);

const syncStartSlot = Slot.from(
	syncCommitteeStartEpoch * BigInt(SLOTS_PER_EPOCH),
);
const syncEndSlot = Slot.from(
	syncCommitteeEndEpoch * BigInt(SLOTS_PER_EPOCH) - 1n,
);

console.log(
	"Sync committee period:",
	syncCommitteeStartEpoch,
	"to",
	syncCommitteeEndEpoch,
);
console.log("Start slot:", syncStartSlot);
console.log("End slot:", syncEndSlot);
console.log("Total slots:", Number(syncEndSlot - syncStartSlot) + 1);
console.log("Duration:", EPOCHS_PER_SYNC_COMMITTEE, "epochs (~27.3 hours)");

// Validator activation queue
console.log("\n=== Validator Activation Timeline ===");
const depositSlot = Slot.from(7500000n);
const depositEpoch = Slot.toEpoch(depositSlot);

// Activation happens at epoch boundary after queue delay
const MIN_ACTIVATION_DELAY = 4; // epochs
const activationEpoch = depositEpoch + BigInt(MIN_ACTIVATION_DELAY);
const activationSlot = Slot.from(activationEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Deposit slot:", depositSlot);
console.log("Deposit epoch:", depositEpoch);
console.log("Minimum activation delay:", MIN_ACTIVATION_DELAY, "epochs");
console.log("Activation epoch:", activationEpoch);
console.log("Activation slot:", activationSlot);
console.log("Slots to wait:", Number(activationSlot - depositSlot));

// Exit queue
console.log("\n=== Validator Exit Timeline ===");
const exitRequestSlot = Slot.from(7600000n);
const exitRequestEpoch = Slot.toEpoch(exitRequestSlot);

const MIN_EXIT_DELAY = 4; // epochs
const exitEpoch = exitRequestEpoch + BigInt(MIN_EXIT_DELAY);
const exitSlot = Slot.from(exitEpoch * BigInt(SLOTS_PER_EPOCH));

const MIN_WITHDRAWAL_DELAY = 256; // epochs
const withdrawableEpoch = exitEpoch + BigInt(MIN_WITHDRAWAL_DELAY);
const withdrawableSlot = Slot.from(withdrawableEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Exit request slot:", exitRequestSlot);
console.log("Exit request epoch:", exitRequestEpoch);
console.log("Exit epoch:", exitEpoch, `(+${MIN_EXIT_DELAY} epochs)`);
console.log("Exit slot:", exitSlot);
console.log(
	"Withdrawable epoch:",
	withdrawableEpoch,
	`(+${MIN_WITHDRAWAL_DELAY} epochs)`,
);
console.log("Withdrawable slot:", withdrawableSlot);
console.log(
	"Total slots to full withdrawal:",
	Number(withdrawableSlot - exitRequestSlot),
);

// Slashing timeline
console.log("\n=== Slashing Timeline ===");
const slashingSlot = Slot.from(7700000n);
const slashingEpoch = Slot.toEpoch(slashingSlot);

const EPOCHS_PER_SLASHING_WITHDRAWAL = 8192; // ~36 days
const slashingWithdrawalEpoch =
	slashingEpoch + BigInt(EPOCHS_PER_SLASHING_WITHDRAWAL);
const slashingWithdrawalSlot = Slot.from(
	slashingWithdrawalEpoch * BigInt(SLOTS_PER_EPOCH),
);

console.log("Slashing slot:", slashingSlot);
console.log("Slashing epoch:", slashingEpoch);
console.log(
	"Withdrawal epoch:",
	slashingWithdrawalEpoch,
	`(+${EPOCHS_PER_SLASHING_WITHDRAWAL} epochs)`,
);
console.log("Withdrawal slot:", slashingWithdrawalSlot);
console.log(
	"Slots until withdrawal:",
	Number(slashingWithdrawalSlot - slashingSlot),
);

// Duty lookahead
console.log("\n=== Duty Lookahead ===");
const currentDutySlot = Slot.from(7800000n);
const currentDutyEpoch = Slot.toEpoch(currentDutySlot);
const nextEpoch = currentDutyEpoch + 1n;
const nextEpochSlot = Slot.from(nextEpoch * BigInt(SLOTS_PER_EPOCH));

console.log("Current slot:", currentDutySlot);
console.log("Current epoch:", currentDutyEpoch);
console.log("Next epoch:", nextEpoch);
console.log("Next epoch starts at slot:", nextEpochSlot);
console.log("Slots until next epoch:", Number(nextEpochSlot - currentDutySlot));
console.log("(Validators know duties 1 epoch in advance)");
