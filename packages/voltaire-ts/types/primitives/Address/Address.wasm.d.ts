/**
 * WASM implementation of Address primitives
 * Uses WebAssembly bindings to Zig implementation for high-performance operations
 */
import type { AddressType as BrandedAddress } from "./AddressType.js";
import type { Checksummed } from "./ChecksumAddress.js";
import type { Lowercase } from "./LowercaseAddress.js";
import type { Uppercase } from "./UppercaseAddress.js";
/**
 * Create Address from hex string (WASM implementation)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte Address
 * @throws {Error} If hex format is invalid
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export declare function fromHex(hex: string): BrandedAddress;
/**
 * Convert Address to lowercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Lowercase hex string with 0x prefix
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const hex = Address.toHex(addr);
 * ```
 */
export declare function toHex(address: BrandedAddress): string;
/**
 * Convert Address to EIP-55 checksummed hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Checksummed hex string with 0x prefix
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const checksummed = Address.toChecksummed(addr);
 * ```
 */
export declare function toChecksummed(address: BrandedAddress): Checksummed;
/**
 * Convert Address to lowercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Lowercase hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const lower = Address.toLowercase(addr);
 * ```
 */
export declare function toLowercase(address: BrandedAddress): Lowercase;
/**
 * Convert Address to uppercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Uppercase hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const upper = Address.toUppercase(addr);
 * ```
 */
export declare function toUppercase(address: BrandedAddress): Uppercase;
/**
 * Check if address is zero address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns true if address is 0x0000...0000
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isZero(addr)) { ... }
 * ```
 */
export declare function isZero(address: BrandedAddress): boolean;
/**
 * Compare two addresses for equality
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns true if addresses are equal
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.equals(addr1, addr2)) { ... }
 * ```
 */
export declare function equals(a: BrandedAddress, b: BrandedAddress): boolean;
/**
 * Validate EIP-55 checksum
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string to validate
 * @returns true if checksum is valid
 * @throws {never} Never throws - returns false on errors
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isValidChecksum('0x742d35Cc...')) { ... }
 * ```
 */
export declare function isValidChecksum(hex: string): boolean;
/**
 * Validate address format
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string to validate
 * @returns true if valid address format
 * @throws {never} Never throws - returns false on errors
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isValid('0x742d35...')) { ... }
 * ```
 */
export declare function isValid(hex: string): boolean;
/**
 * Calculate CREATE address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const contract = Address.calculateCreateAddress(sender, 42n);
 * ```
 */
export declare function calculateCreateAddress(sender: BrandedAddress, nonce: bigint): BrandedAddress;
/**
 * Calculate CREATE2 address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param sender - Sender address (20 bytes)
 * @param salt - 32-byte salt
 * @param initCode - Contract initialization code
 * @returns Contract address
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const contract = Address.calculateCreate2Address(sender, salt, initCode);
 * ```
 */
export declare function calculateCreate2Address(sender: BrandedAddress, salt: Uint8Array, initCode: Uint8Array): BrandedAddress;
/**
 * Create Address from bytes
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param bytes - 20-byte array
 * @returns Address
 * @throws {InvalidAddressLengthError} If not exactly 20 bytes
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromBytes(new Uint8Array(20));
 * ```
 */
export declare function fromBytes(bytes: Uint8Array): BrandedAddress;
/**
 * Create Address from number/bigint
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param value - Number or bigint value
 * @returns Address
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromNumber(123n);
 * ```
 */
export declare function fromNumber(value: number | bigint): BrandedAddress;
/**
 * Create Address from public key coordinates
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param x - Public key X coordinate
 * @param y - Public key Y coordinate
 * @returns Address derived from public key
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
export declare function fromPublicKey(x: bigint, y: bigint): BrandedAddress;
/**
 * Convert Address to U256
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns U256 representation
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const u256 = Address.toU256(addr);
 * ```
 */
export declare function toU256(address: BrandedAddress): bigint;
/**
 * Convert Address to ABI-encoded format (32 bytes, left-padded)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns 32-byte ABI-encoded address
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const encoded = Address.toAbiEncoded(addr);
 * ```
 */
export declare function toAbiEncoded(address: BrandedAddress): Uint8Array;
/**
 * Create Address from ABI-encoded format
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param encoded - 32-byte ABI-encoded address
 * @returns Address
 * @throws {InvalidAddressLengthError} If not 32 bytes
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromAbiEncoded(encoded);
 * ```
 */
export declare function fromAbiEncoded(encoded: Uint8Array): BrandedAddress;
/**
 * Convert Address to short hex format (0x1234...5678)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @param sliceLength - Number of characters to show on each side (default: 4)
 * @returns Abbreviated hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const short = Address.toShortHex(addr);
 * ```
 */
export declare function toShortHex(address: BrandedAddress, sliceLength?: number): string;
/**
 * Format Address for display (checksummed)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Checksummed hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const formatted = Address.format(addr);
 * ```
 */
export declare function format(address: BrandedAddress): string;
/**
 * Lexicographic comparison of addresses
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const result = Address.compare(addr1, addr2);
 * ```
 */
export declare function compare(a: BrandedAddress, b: BrandedAddress): number;
/**
 * Check if first address is less than second
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns true if a < b
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.lessThan(addr1, addr2)) { ... }
 * ```
 */
export declare function lessThan(a: BrandedAddress, b: BrandedAddress): boolean;
/**
 * Check if first address is greater than second
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns true if a > b
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.greaterThan(addr1, addr2)) { ... }
 * ```
 */
export declare function greaterThan(a: BrandedAddress, b: BrandedAddress): boolean;
/**
 * Zero address constant
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @returns Zero address (0x0000...0000)
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const zero = Address.zero();
 * ```
 */
export declare function zero(): BrandedAddress;
/**
 * Universal Address factory (Namespace API - use Address() for Class API)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param value - Number, bigint, string, or Uint8Array
 * @returns Address
 * @throws {Error} If value type is invalid
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export declare function from(value: number | bigint | string | Uint8Array): BrandedAddress;
export declare const Address: {
    fromHex: typeof fromHex;
    fromBytes: typeof fromBytes;
    fromNumber: typeof fromNumber;
    fromPublicKey: typeof fromPublicKey;
    fromAbiEncoded: typeof fromAbiEncoded;
    from: typeof from;
    toHex: typeof toHex;
    toChecksummed: typeof toChecksummed;
    toLowercase: typeof toLowercase;
    toUppercase: typeof toUppercase;
    toU256: typeof toU256;
    toAbiEncoded: typeof toAbiEncoded;
    toShortHex: typeof toShortHex;
    format: typeof format;
    isZero: typeof isZero;
    equals: typeof equals;
    isValid: typeof isValid;
    isValidChecksum: typeof isValidChecksum;
    calculateCreateAddress: typeof calculateCreateAddress;
    calculateCreate2Address: typeof calculateCreate2Address;
    compare: typeof compare;
    lessThan: typeof lessThan;
    greaterThan: typeof greaterThan;
    zero: typeof zero;
};
export default Address;
//# sourceMappingURL=Address.wasm.d.ts.map