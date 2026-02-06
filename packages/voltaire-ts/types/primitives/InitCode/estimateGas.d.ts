/**
 * Estimate gas cost for contract creation
 *
 * Gas cost = 21000 (base) + 200 * non-zero bytes + 4 * zero bytes + 32000 (creation)
 *
 * @param {import('./InitCodeType.js').InitCodeType} code - InitCode
 * @returns {bigint} Estimated gas cost
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const init = InitCode.from("0x608060405234801561001057600080fd5b50...");
 * const gas = InitCode._estimateGas(init);
 * console.log(`Estimated gas: ${gas}`);
 * ```
 */
export function estimateGas(code: import("./InitCodeType.js").InitCodeType): bigint;
//# sourceMappingURL=estimateGas.d.ts.map