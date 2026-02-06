import { MAINNET } from "./constants.js";
/**
 * Check if chain ID is Ethereum mainnet
 *
 * @this {number}
 * @returns {boolean} True if mainnet
 *
 * @example
 * ```typescript
 * const isMain = ChainId._isMainnet.call(chainId);
 * ```
 */
export function isMainnet() {
    return this === MAINNET;
}
