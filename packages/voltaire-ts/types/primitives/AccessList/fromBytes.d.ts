import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Decode RLP bytes to access list
 *
 * @param bytes - RLP-encoded access list
 * @returns Decoded access list
 * @throws {DecodingError} If RLP decoding fails
 * @throws {InvalidFormatError} If structure is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 *
 * @example
 * ```typescript
 * const list = AccessList.fromBytes(bytes);
 * ```
 */
export declare function fromBytes(bytes: Uint8Array): BrandedAccessList;
//# sourceMappingURL=fromBytes.d.ts.map