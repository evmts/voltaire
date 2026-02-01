/**
 * Create UserOperation from input object
 *
 * @param {Object} params - UserOperation parameters
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} params.sender - Smart account address
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.nonce - Anti-replay nonce
 * @param {Uint8Array | string} params.initCode - Account initialization code
 * @param {Uint8Array | string} params.callData - Calldata to execute
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.callGasLimit - Gas for execution
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.verificationGasLimit - Gas for verification
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.preVerificationGas - Fixed gas overhead
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.maxFeePerGas - Max total fee per gas
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.maxPriorityFeePerGas - Max priority fee per gas
 * @param {Uint8Array | string} params.paymasterAndData - Paymaster address and data
 * @param {Uint8Array | string} params.signature - Account signature
 * @returns {import('./UserOperationType.js').UserOperationType} UserOperation
 *
 * @example
 * ```typescript
 * const userOp = UserOperation.from({
 *   sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   nonce: 0n,
 *   initCode: "0x",
 *   callData: "0x",
 *   callGasLimit: 100000n,
 *   verificationGasLimit: 200000n,
 *   preVerificationGas: 50000n,
 *   maxFeePerGas: 1000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
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
    callGasLimit: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    verificationGasLimit: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    preVerificationGas: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    maxFeePerGas: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    maxPriorityFeePerGas: import("../Uint/Uint256Type.js").Uint256Type | bigint | number | string;
    paymasterAndData: Uint8Array | string;
    signature: Uint8Array | string;
}): import("./UserOperationType.js").UserOperationType;
//# sourceMappingURL=from.d.ts.map