/**
 * Compute userOpHash for signing
 *
 * userOpHash = keccak256(abi.encode(userOp, entryPoint, chainId))
 *
 * @param {import('./UserOperationType.js').UserOperationType} userOp - User operation
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} entryPoint - EntryPoint contract address
 * @param {bigint | number} chainId - Chain ID
 * @returns {Uint8Array} 32-byte hash for signing
 *
 * @example
 * ```typescript
 * const hash = UserOperation.hash(userOp, ENTRYPOINT_V06, 1n);
 * const signature = await account.signMessage(hash);
 * ```
 */
export function hash(userOp: import("./UserOperationType.js").UserOperationType, entryPoint: import("../Address/AddressType.js").AddressType | string | number | bigint | Uint8Array, chainId: bigint | number): Uint8Array;
//# sourceMappingURL=hash.d.ts.map