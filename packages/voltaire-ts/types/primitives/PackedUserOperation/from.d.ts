/**
 * Create PackedUserOperation from input object
 *
 * @param {Object} params - PackedUserOperation parameters
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} params.sender - Smart account address
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.nonce - Anti-replay nonce
 * @param {Uint8Array | string} params.initCode - Account initialization code
 * @param {Uint8Array | string} params.callData - Calldata to execute
 * @param {Uint8Array | string} params.accountGasLimits - Packed gas limits (32 bytes)
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.preVerificationGas - Fixed gas overhead
 * @param {Uint8Array | string} params.gasFees - Packed gas fees (32 bytes)
 * @param {Uint8Array | string} params.paymasterAndData - Paymaster address and data
 * @param {Uint8Array | string} params.signature - Account signature
 * @returns {import('./PackedUserOperationType.js').PackedUserOperationType} PackedUserOperation
 *
 * @example
 * ```typescript
 * const packedUserOp = PackedUserOperation.from({
 *   sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   nonce: 0n,
 *   initCode: "0x",
 *   callData: "0x",
 *   accountGasLimits: "0x...", // 32 bytes
 *   preVerificationGas: 50000n,
 *   gasFees: "0x...", // 32 bytes
 *   paymasterAndData: "0x",
 *   signature: "0x",
 * });
 * ```
 */
export function from(params: {
    sender: import("../Address/AddressType.js").AddressType | string | number | bigint | Uint8Array;
    nonce: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    initCode: Uint8Array | string;
    callData: Uint8Array | string;
    accountGasLimits: Uint8Array | string;
    preVerificationGas: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    gasFees: Uint8Array | string;
    paymasterAndData: Uint8Array | string;
    signature: Uint8Array | string;
}): import("./PackedUserOperationType.js").PackedUserOperationType;
//# sourceMappingURL=from.d.ts.map