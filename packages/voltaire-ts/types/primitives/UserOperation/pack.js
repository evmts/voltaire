/**
 * Pack UserOperation (v0.6) to PackedUserOperation (v0.7)
 *
 * Packs gas limits and fees into bytes32 for v0.7 entry point.
 *
 * @param {import('./UserOperationType.js').UserOperationType} userOp - User operation v0.6
 * @returns {import('../PackedUserOperation/PackedUserOperationType.js').PackedUserOperationType} Packed user operation v0.7
 *
 * @example
 * ```typescript
 * const packedUserOp = UserOperation.pack(userOp);
 * ```
 */
export function pack(userOp) {
    // Pack accountGasLimits: verificationGasLimit (128 bits) || callGasLimit (128 bits)
    const accountGasLimits = new Uint8Array(32);
    const verificationBytes = new Uint8Array(16);
    const callBytes = new Uint8Array(16);
    // Convert limits to 128-bit values
    let verification = /** @type {bigint} */ (userOp.verificationGasLimit);
    for (let i = 15; i >= 0; i--) {
        verificationBytes[i] = Number(verification & 0xffn);
        verification >>= 8n;
    }
    let call = /** @type {bigint} */ (userOp.callGasLimit);
    for (let i = 15; i >= 0; i--) {
        callBytes[i] = Number(call & 0xffn);
        call >>= 8n;
    }
    accountGasLimits.set(verificationBytes, 0);
    accountGasLimits.set(callBytes, 16);
    // Pack gasFees: maxPriorityFeePerGas (128 bits) || maxFeePerGas (128 bits)
    const gasFees = new Uint8Array(32);
    const priorityBytes = new Uint8Array(16);
    const maxBytes = new Uint8Array(16);
    let priority = /** @type {bigint} */ (userOp.maxPriorityFeePerGas);
    for (let i = 15; i >= 0; i--) {
        priorityBytes[i] = Number(priority & 0xffn);
        priority >>= 8n;
    }
    let max = /** @type {bigint} */ (userOp.maxFeePerGas);
    for (let i = 15; i >= 0; i--) {
        maxBytes[i] = Number(max & 0xffn);
        max >>= 8n;
    }
    gasFees.set(priorityBytes, 0);
    gasFees.set(maxBytes, 16);
    return /** @type {import('../PackedUserOperation/PackedUserOperationType.js').PackedUserOperationType} */ ({
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees,
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
    });
}
