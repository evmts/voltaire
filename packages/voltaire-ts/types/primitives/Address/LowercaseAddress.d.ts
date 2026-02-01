/**
 * @typedef {import('../Hex/HexType.js').HexType & { readonly __variant: 'Address'; readonly __lowercase: true }} Lowercase
 */
/**
 * Create lowercase address hex string from Address
 *
 * @param {import('./AddressType.js').AddressType} addr - Address to format
 * @returns {Lowercase} Lowercase address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const lower = Lowercase.from(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function from(addr: import("./AddressType.js").AddressType): Lowercase;
export type Lowercase = import("../Hex/HexType.js").HexType & {
    readonly __variant: "Address";
    readonly __lowercase: true;
};
//# sourceMappingURL=LowercaseAddress.d.ts.map