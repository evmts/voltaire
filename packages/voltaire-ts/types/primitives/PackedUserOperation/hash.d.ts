/**
 * Compute userOpHash for PackedUserOperation
 *
 * userOpHash = keccak256(abi.encode(packedUserOp, entryPoint, chainId))
 *
 * @param {import('./PackedUserOperationType.js').PackedUserOperationType} packedUserOp - Packed user operation
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} entryPoint - EntryPoint contract address
 * @param {bigint | number} chainId - Chain ID
 * @returns {Uint8Array} 32-byte hash for signing
 *
 * @example
 * ```typescript
 * const hash = PackedUserOperation.hash(packedUserOp, ENTRYPOINT_V07, 1n);
 * const signature = await account.signMessage(hash);
 * ```
 */
export function hash(packedUserOp: import("./PackedUserOperationType.js").PackedUserOperationType, entryPoint: import("../Address/AddressType.js").AddressType | string | number | bigint | Uint8Array, chainId: bigint | number): Uint8Array;
//# sourceMappingURL=hash.d.ts.map