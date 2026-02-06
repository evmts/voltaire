/**
 * Check if two ForkIds are compatible (EIP-2124 fork validation)
 *
 * Compatible if:
 * 1. Hashes match and next blocks match (identical)
 * 2. Hashes match and remote next is 0 (remote knows of no future forks)
 * 3. Hashes match and local next is 0 (local knows of no future forks)
 * 4. Hashes differ but remote next is >= local next (remote is ahead but compatible)
 *
 * @param {import('./ForkIdType.js').ForkIdType} local - Local ForkId
 * @param {import('./ForkIdType.js').ForkIdType} remote - Remote peer's ForkId
 * @returns {boolean} True if compatible
 *
 * @example
 * ```typescript
 * const compatible = ForkId.matches(localForkId, peerForkId);
 * if (!compatible) {
 *   console.log("Fork incompatible - disconnect peer");
 * }
 * ```
 */
export function matches(local: import("./ForkIdType.js").ForkIdType, remote: import("./ForkIdType.js").ForkIdType): boolean;
//# sourceMappingURL=matches.d.ts.map