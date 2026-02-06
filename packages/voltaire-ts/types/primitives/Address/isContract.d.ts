/**
 * @typedef {import('./AddressType.js').AddressType} AddressType
 */
/**
 * Factory for checking if an address is a contract (has deployed code).
 *
 * This requires RPC access to query the blockchain for code at the address.
 * EOAs (Externally Owned Accounts) have no code, while contracts have bytecode.
 *
 * @param {Object} deps - Dependencies
 * @param {(address: string) => Promise<string>} deps.eth_getCode - RPC method to get code at address.
 *   Should return hex-encoded bytecode or "0x" for EOAs.
 *   Signature matches standard JSON-RPC eth_getCode (address, block) but block defaults to "latest".
 * @returns {(address: AddressType) => Promise<boolean>}
 *
 * @example
 * ```typescript
 * import { IsContract } from './isContract.js'
 * import { toHex } from './toHex.js'
 *
 * // With a provider
 * const isContract = IsContract({
 *   eth_getCode: async (addr) => provider.request({
 *     method: 'eth_getCode',
 *     params: [addr, 'latest']
 *   })
 * })
 *
 * const usdcAddress = Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
 * const isUsdcContract = await isContract(usdcAddress) // true
 *
 * const eoaAddress = Address('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 * const isEoaContract = await isContract(eoaAddress) // false
 * ```
 */
export function IsContract({ eth_getCode }: {
    eth_getCode: (address: string) => Promise<string>;
}): (address: AddressType) => Promise<boolean>;
export type AddressType = import("./AddressType.js").AddressType;
//# sourceMappingURL=isContract.d.ts.map