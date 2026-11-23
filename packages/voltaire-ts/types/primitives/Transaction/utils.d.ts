import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedRlp } from "../Rlp/RlpType.js";
type Encodable = Uint8Array | BrandedRlp | Encodable[];
/**
 * Read an RLP byte-string field. Rejects lists and missing fields.
 * @internal
 *
 * @throws {DecodingError} If the field is not an RLP byte string
 */
export declare function decodeBytesField(field: BrandedRlp | undefined, name: string): Uint8Array;
/**
 * Read an RLP list field. Rejects byte strings and missing fields.
 * @internal
 *
 * @throws {DecodingError} If the field is not an RLP list
 */
export declare function decodeListField(field: BrandedRlp | undefined, name: string): BrandedRlp[];
/**
 * Decode a canonical RLP unsigned integer field: a byte string with no
 * leading zero byte (zero is the empty string) of at most `maxBytes` bytes.
 * @internal
 *
 * @throws {DecodingError} If the field is a list, has a leading zero byte, or
 * is longer than `maxBytes`
 */
export declare function decodeUint(field: BrandedRlp | undefined, maxBytes: number, name?: string): bigint;
/**
 * Decode a canonical `yParity` field: the empty string is `0`, the single
 * byte `0x01` is `1`. `0x00`, values above 1 and multi-byte strings are
 * rejected, so each parity has exactly one encoding.
 * @internal
 *
 * @throws {DecodingError} If the field is not a canonical 0 or 1
 */
export declare function decodeYParity(field: BrandedRlp | undefined): 0 | 1;
/**
 * Encode bigint as big-endian bytes, removing leading zeros
 * @internal
 */
export declare function encodeBigintCompact(value: bigint): Uint8Array;
/**
 * Encode a signature scalar (`r`, `s`) as a minimal RLP integer: strip
 * leading zero bytes, so a zero scalar encodes as the empty string.
 * @internal
 */
export declare function encodeSignatureScalar(value: Uint8Array): Uint8Array;
/**
 * Encode `yParity` as a minimal RLP integer (`0` is the empty string).
 * @internal
 */
export declare function encodeYParity(yParity: number): Uint8Array;
/**
 * Decode a signature scalar (`r`, `s`) from canonical RLP integer bytes and
 * left-pad it to 32 bytes for the public API.
 * @internal
 *
 * @throws {InvalidLengthError} If the value is longer than 32 bytes
 * @throws {DecodingError} If the value has a leading zero byte
 */
export declare function decodeSignatureScalar(bytes: Uint8Array): Uint8Array;
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
 * Decode bigint from canonical big-endian RLP integer bytes (no leading zero
 * byte; zero is the empty string)
 * @internal
 *
 * @throws {DecodingError} If the value has a leading zero byte
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
 * Decodes the RLP authorization list field into Authorization objects. Every
 * tuple is `[chainId, address, nonce, yParity, r, s]` with canonical integers:
 * `chainId` at most 32 bytes, `address` exactly 20 bytes, `nonce` at most 8
 * bytes, `yParity` any canonical uint8 (0..255), `r`/`s` at most 32 bytes.
 *
 * EIP-7702 types the tuple's `y_parity` as a uint8 on the wire. A tuple whose
 * parity is not 0 or 1 is skipped during authorization processing; it does
 * not invalidate the transaction, so decoding must accept it.
 *
 * @throws {InvalidFormatError} If the field or a tuple is not a list of 6 byte strings
 * @throws {DecodingError} If an integer is non-canonical or out of range
 * @throws {InvalidLengthError} If the address is not 20 bytes or a scalar exceeds 32 bytes
 */
export declare function decodeAuthorizationList(data: BrandedRlp | undefined): {
    chainId: bigint;
    address: BrandedAddress;
    nonce: bigint;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
}[];
export {};
//# sourceMappingURL=utils.d.ts.map