import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedRlp } from "../Rlp/RlpType.js";
type Encodable = Uint8Array | BrandedRlp | Encodable[];
/**
 * Encode bigint as big-endian bytes, removing leading zeros
 * @internal
 */
export declare function encodeBigintCompact(value: bigint): Uint8Array;
/**
 * Encode address for RLP (empty bytes for null, 20 bytes otherwise)
 * @internal
 *
 * Assumes address is a valid BrandedAddress (20 bytes) or null.
 * Validation happens at the boundary when creating branded types.
 */
export declare function encodeAddress(address: BrandedAddress | null): Uint8Array;
/**
 * Decode address from RLP bytes (null for empty, Address otherwise)
 * @internal
 *
 * Assumes RLP-decoded bytes have been validated. Validation happens at the boundary
 * when creating branded types via Address.from().
 *
 * @throws {InvalidLengthError} If address length is not 0 or 20 bytes
 */
export declare function decodeAddress(bytes: Uint8Array): BrandedAddress | null;
/**
 * Decode bigint from big-endian bytes
 * @internal
 */
export declare function decodeBigint(bytes: Uint8Array): bigint;
/**
 * Recover Address from ECDSA signature
 * @internal
 *
 * Recovers a BrandedAddress from a secp256k1 signature and message hash.
 * Assumes signature components (r, s) and messageHash are valid.
 * Validation happens at the boundary when creating branded types.
 *
 * @param signature Signature components (r, s, v)
 * @param messageHash HashType (32 bytes) of the signed message
 * @returns BrandedAddress recovered from the signature
 */
export declare function recoverAddress(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, messageHash: HashType): BrandedAddress;
/**
 * Encode access list for RLP
 * @internal
 *
 * Encodes an access list of BrandedAddress and HashType entries for RLP serialization.
 * Assumes all addresses are valid BrandedAddress (20 bytes) and storage keys are
 * valid HashType (32 bytes). Validation happens at the boundary.
 */
export declare function encodeAccessList(accessList: readonly {
    address: BrandedAddress;
    storageKeys: readonly HashType[];
}[]): Encodable[];
/**
 * Decode access list from RLP
 * @internal
 *
 * Decodes RLP-encoded access list items into BrandedAddress and HashType arrays.
 * Validates format and length during decoding - this is a boundary between RLP data
 * and typed primitives.
 *
 * @throws {InvalidFormatError} If access list format is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 */
export declare function decodeAccessList(data: BrandedRlp[]): {
    address: BrandedAddress;
    storageKeys: HashType[];
}[];
/**
 * Encode authorization list for RLP (EIP-7702)
 * @internal
 *
 * Encodes an authorization list where each authorization contains a BrandedAddress.
 * Assumes all addresses are valid BrandedAddress (20 bytes).
 * Validation happens at the boundary when creating branded types.
 */
export declare function encodeAuthorizationList(authList: readonly {
    chainId: bigint;
    address: BrandedAddress;
    nonce: bigint;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
}[]): Encodable[];
/**
 * Decode authorization list from RLP (EIP-7702)
 * @internal
 *
 * Decodes RLP-encoded authorization items into Authorization objects containing
 * BrandedAddress values. Validates format and length during decoding - this is
 * a boundary between RLP data and typed primitives.
 *
 * @throws {InvalidFormatError} If authorization list format is invalid
 */
export declare function decodeAuthorizationList(data: BrandedRlp[]): {
    chainId: bigint;
    address: BrandedAddress;
    nonce: bigint;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
}[];
export {};
//# sourceMappingURL=utils.d.ts.map