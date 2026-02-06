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
export function selfdestruct(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xff_SELFDESTRUCT.d.ts.map