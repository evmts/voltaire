/**
 * @typedef {import('../Hex/HexType.js').HexType & { readonly __variant: 'Address'; readonly __checksummed: true }} Checksummed
 */
/**
 * Factory: Create checksummed address from any input
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(value: number | bigint | string | Uint8Array) => Checksummed} Function that converts to checksummed address
 *
 * @example
 * ```typescript
 * import { From } from '@tevm/voltaire/Address/ChecksumAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const from = From({ keccak256 })
 * const checksummed = from("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
 * // "0x742d35Cc6634c0532925a3b844bc9e7595F251E3"
 * ```
 */
export function From({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (value: number | bigint | string | Uint8Array) => Checksummed;
/**
 * Factory: Check if string has valid EIP-55 checksum
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(str: string) => boolean} Function that validates EIP-55 checksum
 *
 * @example
 * ```typescript
 * import { IsValid } from '@tevm/voltaire/Address/ChecksumAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const isValid = IsValid({ keccak256 })
 * if (isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum")
 * }
 * ```
 */
export function IsValid({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (str: string) => boolean;
export type Checksummed = import("../Hex/HexType.js").HexType & {
    readonly __variant: "Address";
    readonly __checksummed: true;
};
//# sourceMappingURL=ChecksumAddress.d.ts.map