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
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function selfdestruct(frame) {
    // Pop beneficiary address
    const resultBeneficiary = popStack(frame);
    if (resultBeneficiary.error)
        return resultBeneficiary.error;
    const _beneficiary = resultBeneficiary.value;
    // Calculate base gas cost
    // EIP-150 (Tangerine Whistle): 5000 gas base cost
    const gasCost = 5000n;
    // EIP-2929 (Berlin): cold account access cost
    // If beneficiary is cold (not accessed), add 2600 gas
    // In a full implementation:
    // const isBeneficiaryWarm = frame.accessList?.includes(beneficiary);
    // if (!isBeneficiaryWarm) {
    //   gasCost += 2600n; // ColdAccountAccessCost
    // }
    // Check if beneficiary account exists for new account cost
    // If transferring balance to non-existent account, add 25000 gas
    // In a full implementation:
    // const selfBalance = frame.balances?.get(frame.address) ?? 0n;
    // const beneficiaryExists = frame.balances?.has(beneficiary) || frame.code?.has(beneficiary);
    // if (selfBalance > 0n && !beneficiaryExists) {
    //   gasCost += 25000n; // CallNewAccountGas
    // }
    const gasErr = consumeGas(frame, gasCost);
    if (gasErr)
        return gasErr;
    // EIP-214: SELFDESTRUCT cannot be executed in static call context
    // This check happens AFTER gas charging (per Yellow Paper semantics)
    if (frame.isStatic) {
        return { type: "WriteProtection" };
    }
    // Perform selfdestruct execution
    // Behavior depends on hardfork (Cancun changed semantics via EIP-6780)
    //
    // Pre-Cancun behavior (before EIP-6780):
    // 1. Always transfer balance from frame.address to beneficiary
    // 2. Mark account for deletion (removed from state at end of transaction)
    // 3. Refund 24000 gas (removed in EIP-3529/London, so no refund post-London)
    //
    // Post-Cancun (EIP-6780):
    // 1. Always transfer balance to beneficiary (even if not created in same tx)
    // 2. Only mark account for deletion if created in same transaction
    // 3. If not created in same tx: balance transfers but code/storage/nonce persist
    // 4. No gas refund (EIP-3529 removed refunds)
    //
    // In a full implementation:
    // - Transfer balance: frame.balances[beneficiary] += frame.balances[frame.address]
    // - Zero current balance: frame.balances[frame.address] = 0
    // - Mark for deletion (if applicable for hardfork)
    // - Apply gas refunds to EVM's gas_refund counter (if pre-London)
    // Halt execution (frame stops processing further opcodes)
    frame.stopped = true;
    // No value pushed to stack (SELFDESTRUCT doesn't push anything)
    // Program counter doesn't increment (execution stops)
    return null;
}
/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/FrameType.js").EvmError | null}
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
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/FrameType.js").EvmError}}
 */
function popStack(frame) {
    if (frame.stack.length === 0) {
        return { value: null, error: { type: "StackUnderflow" } };
    }
    const value = /** @type {bigint} */ (frame.stack.pop());
    return { value, error: null };
}
