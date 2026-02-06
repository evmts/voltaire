/**
 * Convert RevertReason to string representation
 *
 * @param {import('./RevertReasonType.js').RevertReasonType} reason - Revert reason
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const str = RevertReason.toString(reason);
 * // "Error: Insufficient balance"
 * // "Panic(0x11): Arithmetic overflow/underflow"
 * ```
 */
export function toString(reason: import("./RevertReasonType.js").RevertReasonType): string;
//# sourceMappingURL=toString.d.ts.map