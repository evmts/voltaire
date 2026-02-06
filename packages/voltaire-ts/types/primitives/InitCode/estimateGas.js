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
export function estimateGas(code) {
    const TX_BASE_GAS = 21000n;
    const CREATE_GAS = 32000n;
    const NONZERO_BYTE_GAS = 16n; // EIP-2028
    const ZERO_BYTE_GAS = 4n;
    let nonZeroBytes = 0n;
    let zeroBytes = 0n;
    for (let i = 0; i < code.length; i++) {
        if (code[i] === 0) {
            zeroBytes++;
        }
        else {
            nonZeroBytes++;
        }
    }
    const dataGas = nonZeroBytes * NONZERO_BYTE_GAS + zeroBytes * ZERO_BYTE_GAS;
    return TX_BASE_GAS + CREATE_GAS + dataGas;
}
