import { Slot } from "@tevm/voltaire";
// Example: Validator duty scheduling
// Validators are assigned duties based on slots and epochs

const SLOTS_PER_EPOCH = 32;
const epoch = 1000n;
const firstSlot = epoch * BigInt(SLOTS_PER_EPOCH);

for (let i = 0; i < 8; i++) {
	const slot = Slot(firstSlot + BigInt(i));
	const slotEpoch = Slot.toEpoch(slot);
	const position = Number(slot) % SLOTS_PER_EPOCH;
}
const proposalPositions = [2, 17, 29];
const proposalEpoch = 1500n;

for (const position of proposalPositions) {
	const slot = Slot(proposalEpoch * BigInt(SLOTS_PER_EPOCH) + BigInt(position));
	const slotEpoch = Slot.toEpoch(slot);
}
const EPOCHS_PER_SYNC_COMMITTEE = 256;
const syncCommitteeStartEpoch = 2000n;
const syncCommitteeEndEpoch =
	syncCommitteeStartEpoch + BigInt(EPOCHS_PER_SYNC_COMMITTEE);

const syncStartSlot = Slot(syncCommitteeStartEpoch * BigInt(SLOTS_PER_EPOCH));
const syncEndSlot = Slot(syncCommitteeEndEpoch * BigInt(SLOTS_PER_EPOCH) - 1n);
const depositSlot = Slot(7500000n);
const depositEpoch = Slot.toEpoch(depositSlot);

// Activation happens at epoch boundary after queue delay
const MIN_ACTIVATION_DELAY = 4; // epochs
const activationEpoch = depositEpoch + BigInt(MIN_ACTIVATION_DELAY);
const activationSlot = Slot(activationEpoch * BigInt(SLOTS_PER_EPOCH));
const exitRequestSlot = Slot(7600000n);
const exitRequestEpoch = Slot.toEpoch(exitRequestSlot);

const MIN_EXIT_DELAY = 4; // epochs
const exitEpoch = exitRequestEpoch + BigInt(MIN_EXIT_DELAY);
const exitSlot = Slot(exitEpoch * BigInt(SLOTS_PER_EPOCH));

const MIN_WITHDRAWAL_DELAY = 256; // epochs
const withdrawableEpoch = exitEpoch + BigInt(MIN_WITHDRAWAL_DELAY);
const withdrawableSlot = Slot(withdrawableEpoch * BigInt(SLOTS_PER_EPOCH));
const slashingSlot = Slot(7700000n);
const slashingEpoch = Slot.toEpoch(slashingSlot);

const EPOCHS_PER_SLASHING_WITHDRAWAL = 8192; // ~36 days
const slashingWithdrawalEpoch =
	slashingEpoch + BigInt(EPOCHS_PER_SLASHING_WITHDRAWAL);
const slashingWithdrawalSlot = Slot(
	slashingWithdrawalEpoch * BigInt(SLOTS_PER_EPOCH),
);
const currentDutySlot = Slot(7800000n);
const currentDutyEpoch = Slot.toEpoch(currentDutySlot);
const nextEpoch = currentDutyEpoch + 1n;
const nextEpochSlot = Slot(nextEpoch * BigInt(SLOTS_PER_EPOCH));
