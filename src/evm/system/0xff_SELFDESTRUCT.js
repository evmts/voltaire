/**
 * SELFDESTRUCT opcode (0xff) - Halt execution and register account for deletion
 *
 * Stack: [beneficiary] => []
 * Gas: 5000 + cold account access (EIP-2929) + new account (if needed)
 * Note: Behavior changed significantly in EIP-6780 (Cancun)
 *
 * Pre-Cancun: Marks account for deletion, transfers balance to beneficiary
 * Post-Cancun: Only deletes if account was created in same transaction, always transfers balance
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function selfdestruct(frame) {
	// Pop beneficiary address
	const resultBeneficiary = popStack(frame);
	if (resultBeneficiary.error) return resultBeneficiary.error;
	const beneficiary = resultBeneficiary.value;

	// Calculate base gas cost
	// EIP-150 (Tangerine Whistle): 5000 gas
	let gasCost = 5000n;

	// TODO: EIP-2929 (Berlin) cold account access
	// If beneficiary is cold (not accessed), add 2600 gas
	// const isBeneficiaryWarm = isWarm(beneficiary);
	// if (!isBeneficiaryWarm) {
	//   gasCost += 2600n;
	// }

	// TODO: Check if beneficiary account exists
	// If transferring to non-existent account and have balance, add 25000 gas
	// const selfBalance = getBalance(frame.address);
	// const beneficiaryExists = accountExists(beneficiary);
	// if (selfBalance > 0 && !beneficiaryExists) {
	//   gasCost += 25000n;
	// }

	const gasErr = consumeGas(frame, gasCost);
	if (gasErr) return gasErr;

	// EIP-214: SELFDESTRUCT cannot be executed in static call context
	// This check happens AFTER gas charging
	if (frame.isStatic) {
		return { type: "WriteProtection" };
	}

	// TODO: Actual selfdestruct execution
	// Pre-Cancun (EIP-6780):
	// 1. Transfer balance from frame.address to beneficiary
	// 2. Mark account for deletion (cleared at end of transaction)
	// 3. Refund 24000 gas (removed in EIP-3529 London)
	//
	// Post-Cancun (EIP-6780):
	// 1. Always transfer balance to beneficiary
	// 2. Only mark for deletion if account was created in same transaction
	// 3. If not created in same tx: balance transfers but code/storage/nonce persist
	// 4. No gas refund (EIP-3529)

	// Halt execution
	frame.stopped = true;

	// No value pushed to stack
	// pc doesn't increment (execution stopped)
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null}
 */
function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/BrandedFrame.js").EvmError}}
 */
function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = frame.stack.pop();
	return { value, error: null };
}
