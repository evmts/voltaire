/**
 * Calculate gas cost for authorization list
 *
 * @param {import("./AuthorizationType.js").AuthorizationType[]} authList - Authorization list
 * @param {number} emptyAccounts - Number of empty accounts being authorized
 * @returns {bigint} Total gas cost
 *
 * @example
 * ```typescript
 * const authList: Item[] = [...];
 * const gas = calculateGasCost(authList, 2);
 * console.log(`Gas required: ${gas}`);
 * ```
 */
export function calculateGasCost(authList: import("./AuthorizationType.js").AuthorizationType[], emptyAccounts: number): bigint;
//# sourceMappingURL=calculateGasCost.d.ts.map