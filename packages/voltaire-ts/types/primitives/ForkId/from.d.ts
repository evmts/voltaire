/**
 * Create ForkId from hash and next block number
 *
 * @param {{ hash: Uint8Array | string | number, next: bigint | number | string }} value - Fork ID components
 * @returns {import('./ForkIdType.js').ForkIdType} ForkId
 *
 * @example
 * ```typescript
 * const forkId = ForkId.from({
 *   hash: new Uint8Array([0xfc, 0x64, 0xec, 0x04]),
 *   next: 1920000n,
 * });
 * ```
 */
export function from(value: {
    hash: Uint8Array | string | number;
    next: bigint | number | string;
}): import("./ForkIdType.js").ForkIdType;
//# sourceMappingURL=from.d.ts.map