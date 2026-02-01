/**
 * Unpack PackedUserOperation (v0.7) to UserOperation (v0.6)
 *
 * Extracts gas limits and fees from packed bytes32 fields.
 *
 * @param {import('./PackedUserOperationType.js').PackedUserOperationType} packedUserOp - Packed user operation v0.7
 * @returns {import('../UserOperation/UserOperationType.js').UserOperationType} User operation v0.6
 *
 * @example
 * ```typescript
 * const userOp = PackedUserOperation.unpack(packedUserOp);
 * ```
 */
export function unpack(packedUserOp: import("./PackedUserOperationType.js").PackedUserOperationType): import("../UserOperation/UserOperationType.js").UserOperationType;
//# sourceMappingURL=unpack.d.ts.map