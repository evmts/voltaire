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
export function pack(userOp: import("./UserOperationType.js").UserOperationType): import("../PackedUserOperation/PackedUserOperationType.js").PackedUserOperationType;
//# sourceMappingURL=pack.d.ts.map