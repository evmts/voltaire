import { InvalidAddressLengthError, InvalidValueError } from "./errors.js";
import * as BrandedAddress from "./internal-index.js";
import { setFromBase64Polyfill, setFromHexPolyfill, toBase64Polyfill, } from "./polyfills.js";
export * from "./constants.js";
export * from "./errors.js";
export function Address(value, crypto) {
    const result = BrandedAddress.from(value);
    Object.setPrototypeOf(result, Address.prototype);
    // Store crypto deps on instance
    if (crypto) {
        Object.defineProperty(result, "_crypto", {
            value: crypto,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }
    return result;
}
/**
 * Alias for Address() constructor
 * @deprecated Use Address() directly instead
 */
Address.from = (value) => {
    const result = BrandedAddress.from(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.from.prototype = Address.prototype;
/**
 * Create Address from base64 encoded string
 * @param value - Base64 encoded address (must decode to 20 bytes)
 * @returns Address instance
 * @throws {InvalidAddressLengthError} If decoded length is not 20 bytes
 */
Address.fromBase64 = (value) => {
    const result = BrandedAddress.fromBase64(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.fromBase64.prototype = Address.prototype;
/**
 * Create Address from hex string
 * @param value - Hex string with 0x prefix (40 hex chars = 20 bytes)
 * @param crypto - Optional crypto dependencies for checksummed operations
 * @returns Address instance
 * @throws {InvalidHexFormatError} If hex format is invalid
 * @throws {InvalidAddressLengthError} If length is not 20 bytes
 * @example
 * ```ts
 * Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
 * ```
 */
Address.fromHex = (value, crypto) => {
    const result = BrandedAddress.fromHex(value);
    Object.setPrototypeOf(result, Address.prototype);
    if (crypto) {
        Object.defineProperty(result, "_crypto", {
            value: crypto,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }
    return result;
};
Address.fromHex.prototype = Address.prototype;
/**
 * Create Address from bytes
 * @param value - 20-byte Uint8Array
 * @returns Address instance
 * @throws {InvalidAddressLengthError} If not exactly 20 bytes
 */
Address.fromBytes = (value) => {
    const result = BrandedAddress.fromBytes(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.fromBytes.prototype = Address.prototype;
/**
 * Create Address from number or bigint
 * @param value - Number or bigint to convert (will be left-padded to 20 bytes)
 * @returns Address instance
 * @example
 * ```ts
 * Address.fromNumber(1); // 0x0000...0001
 * ```
 */
Address.fromNumber = (value) => {
    const result = BrandedAddress.fromNumber(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.fromNumber.prototype = Address.prototype;
/**
 * Create Address from secp256k1 public key
 * Derives Ethereum address: keccak256(pubkey)[12:32]
 * @param xOrPublicKey - Either x coordinate (bigint) or 64-byte uncompressed public key
 * @param y - y coordinate (required when first param is bigint)
 * @returns Address instance
 * @throws {InvalidAddressLengthError} If public key is not 64 bytes
 * @throws {InvalidValueError} If x is bigint but y is not provided
 * @example
 * ```ts
 * // From 64-byte public key
 * Address.fromPublicKey(publicKeyBytes);
 * // From coordinates
 * Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
Address.fromPublicKey = ((xOrPublicKey, y) => {
    const result = BrandedAddress.fromPublicKey(xOrPublicKey, y);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
});
Address.fromPublicKey.prototype = Address.prototype;
export const fromPublicKey = Address.fromPublicKey;
/**
 * Create Address from secp256k1 private key
 * Derives public key then Ethereum address
 * @param value - 32-byte private key
 * @returns Address instance
 * @throws {InvalidValueError} If private key is invalid
 */
Address.fromPrivateKey = (value) => {
    const result = BrandedAddress.fromPrivateKey(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.fromPrivateKey.prototype = Address.prototype;
/**
 * Create Address from ABI-encoded bytes (32 bytes, left-padded)
 * @param value - 32-byte ABI-encoded address
 * @returns Address instance (extracts last 20 bytes)
 */
Address.fromAbiEncoded = (value) => {
    const result = BrandedAddress.fromAbiEncoded(value);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
Address.fromAbiEncoded.prototype = Address.prototype;
// ============================================================================
// Static utility methods (don't return Address instances)
// ============================================================================
/**
 * Convert Address to lowercase hex string
 * @param address - Address to convert
 * @returns Lowercase hex with 0x prefix
 */
Address.toHex = BrandedAddress.toHex;
/**
 * Get raw bytes of Address
 * @param address - Address to convert
 * @returns 20-byte Uint8Array
 */
Address.toBytes = BrandedAddress.toBytes;
/**
 * Convert Address to EIP-55 checksummed hex string
 * @param address - Address to convert
 * @returns Checksummed hex string
 */
Address.toChecksummed = BrandedAddress.toChecksummed;
/**
 * Convert Address to lowercase hex string
 * @param address - Address to convert
 * @returns Lowercase hex with 0x prefix
 */
Address.toLowercase = BrandedAddress.toLowercase;
/**
 * Convert Address to uppercase hex string
 * @param address - Address to convert
 * @returns Uppercase hex with 0x prefix
 */
Address.toUppercase = BrandedAddress.toUppercase;
/**
 * Convert Address to uint256 (bigint)
 * @param address - Address to convert
 * @returns BigInt representation
 */
Address.toU256 = BrandedAddress.toU256;
/**
 * Encode Address for ABI (left-pad to 32 bytes)
 * @param address - Address to encode
 * @returns 32-byte ABI-encoded address
 */
Address.toAbiEncoded = BrandedAddress.toAbiEncoded;
/**
 * Convert Address to shortened hex (e.g., 0x1234...5678)
 * @param address - Address to shorten
 * @param startLength - Chars to show at start (default: 6)
 * @param endLength - Chars to show at end (default: 4)
 * @returns Shortened hex string
 */
Address.toShortHex = BrandedAddress.toShortHex;
/**
 * Check if Address is zero address (0x0000...0000)
 * @param address - Address to check
 * @returns True if all bytes are zero
 */
Address.isZero = BrandedAddress.isZero;
/**
 * Check if two Addresses are equal (byte comparison)
 * @param a - First address
 * @param b - Second address
 * @returns True if equal
 */
Address.equals = BrandedAddress.equals;
/**
 * Check if value is a valid Ethereum address format
 * @param value - String or bytes to validate
 * @returns True if valid address format
 */
Address.isValid = BrandedAddress.isValid;
/**
 * Check if hex string has valid EIP-55 checksum
 * @param value - Hex string to validate
 * @returns True if checksum is valid
 */
Address.isValidChecksum = BrandedAddress.isValidChecksum;
/**
 * Type guard: check if value is an Address instance
 * @param value - Value to check
 * @returns True if value is Address
 */
Address.is = BrandedAddress.is;
/**
 * Create zero address (0x0000...0000)
 * @returns Zero address instance
 */
Address.zero = () => {
    const result = BrandedAddress.zero();
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
/**
 * Create Address from individual bytes
 * @param items - 20 byte values (0-255)
 * @returns Address instance
 * @throws {InvalidAddressLengthError} If not exactly 20 items
 * @example
 * ```ts
 * Address.of(0x74, 0x2d, 0x35, ...); // 20 bytes
 * ```
 */
Address.of = (...items) => {
    const result = Uint8Array.of(...items);
    if (result.length !== BrandedAddress.SIZE) {
        throw new InvalidAddressLengthError(`Address must be ${BrandedAddress.SIZE} bytes, got ${result.length}`, {
            value: result,
            expected: `${BrandedAddress.SIZE} bytes`,
            context: { actualLength: result.length },
        });
    }
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
/**
 * Compare two addresses lexicographically
 * @param a - First address
 * @param b - Second address
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
Address.compare = BrandedAddress.compare;
/**
 * Check if first address is less than second
 * @param a - First address
 * @param b - Second address
 * @returns True if a < b
 */
Address.lessThan = BrandedAddress.lessThan;
/**
 * Check if first address is greater than second
 * @param a - First address
 * @param b - Second address
 * @returns True if a > b
 */
Address.greaterThan = BrandedAddress.greaterThan;
// Export standalone helper functions
/**
 * Sort array of addresses lexicographically
 * @param addresses - Array to sort
 * @returns New sorted array
 */
export const sortAddresses = (addresses) => {
    return BrandedAddress.sortAddresses(addresses).map((addr) => {
        Object.setPrototypeOf(addr, Address.prototype);
        return addr;
    });
};
/**
 * Remove duplicate addresses from array
 * @param addresses - Array with potential duplicates
 * @returns New array with duplicates removed
 */
export const deduplicateAddresses = (addresses) => {
    return BrandedAddress.deduplicateAddresses(addresses).map((addr) => {
        Object.setPrototypeOf(addr, Address.prototype);
        return addr;
    });
};
export const toHex = BrandedAddress.toHex;
export const fromHex = Address.fromHex;
export const equals = Address.equals;
/**
 * Sort array of addresses lexicographically
 * @param addresses - Array to sort
 * @returns New sorted array
 */
Address.sortAddresses = (addresses) => {
    return BrandedAddress.sortAddresses(addresses).map((addr) => {
        Object.setPrototypeOf(addr, Address.prototype);
        return addr;
    });
};
/**
 * Remove duplicate addresses from array
 * @param addresses - Array with potential duplicates
 * @returns New array with duplicates removed
 */
Address.deduplicateAddresses = (addresses) => {
    return BrandedAddress.deduplicateAddresses(addresses).map((addr) => {
        Object.setPrototypeOf(addr, Address.prototype);
        return addr;
    });
};
/**
 * Create a copy of an Address
 * @param address - Address to clone
 * @returns New Address instance with same bytes
 */
Address.clone = (address) => {
    const result = BrandedAddress.clone(address);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
/**
 * Calculate CREATE contract deployment address
 * Formula: keccak256(rlp([sender, nonce]))[12:32]
 * @param address - Deployer address
 * @param nonce - Transaction nonce
 * @returns Contract address that would be created
 * @throws {InvalidValueError} If nonce is negative
 */
Address.calculateCreateAddress = (address, nonce) => {
    const result = BrandedAddress.calculateCreateAddress(address, nonce);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
/**
 * Calculate CREATE2 contract deployment address
 * Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 * @param address - Deployer address
 * @param salt - 32-byte salt value
 * @param initCode - Contract initialization bytecode
 * @returns Contract address that would be created
 */
Address.calculateCreate2Address = (address, salt, initCode) => {
    const result = BrandedAddress.calculateCreate2Address(address, salt, initCode);
    Object.setPrototypeOf(result, Address.prototype);
    return result;
};
/** Address size in bytes (20) */
Address.SIZE = BrandedAddress.SIZE;
/**
 * Assert value is valid address, throws if invalid
 * @param value - Value to validate
 * @param options - Validation options (strict: validate checksum)
 * @throws {InvalidAddressError} If not valid address
 */
Address.assert = BrandedAddress.assert;
/**
 * Factory for assert with custom crypto dependencies
 */
Address.Assert = BrandedAddress.Assert;
Address.IsContract = BrandedAddress.IsContract;
// Set up Address.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Address.prototype, Uint8Array.prototype);
// Instance methods
Address.prototype.toBase64 = Uint8Array.prototype.toBase64 ?? toBase64Polyfill;
Address.prototype.setFromBase64 =
    Uint8Array.prototype.setFromBase64 ?? setFromBase64Polyfill;
Address.prototype.toHex = function () {
    return BrandedAddress.toHex(this);
};
Address.prototype.setFromHex =
    Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
Address.prototype.toChecksummed = function () {
    // biome-ignore lint/suspicious/noExplicitAny: wasm interface requires any
    const crypto = this._crypto;
    if (!crypto?.keccak256) {
        throw new InvalidValueError("keccak256 not provided to Address constructor. Pass { keccak256 } to enable toChecksummed()", {
            value: undefined,
            expected: "keccak256 hash function",
            code: -32602,
        });
    }
    const factory = BrandedAddress.ToChecksummed({ keccak256: crypto.keccak256 });
    return factory(this);
};
Address.prototype.toLowercase = function () {
    return BrandedAddress.toLowercase(this);
};
Address.prototype.toUppercase = function () {
    return BrandedAddress.toUppercase(this);
};
Address.prototype.toU256 = function () {
    return BrandedAddress.toU256(this);
};
Address.prototype.toAbiEncoded = function () {
    return BrandedAddress.toAbiEncoded(this);
};
Address.prototype.toShortHex = function () {
    return BrandedAddress.toShortHex(this);
};
Address.prototype.compare = function (other) {
    return BrandedAddress.compare(this, other);
};
Address.prototype.lessThan = function (other) {
    return BrandedAddress.lessThan(this, other);
};
Address.prototype.greaterThan = function (other) {
    return BrandedAddress.greaterThan(this, other);
};
Address.prototype.isZero = function () {
    return BrandedAddress.isZero(this);
};
Address.prototype.equals = function (other) {
    return BrandedAddress.equals(this, other);
};
Address.prototype.toBytes = function () {
    return BrandedAddress.toBytes(this);
};
Address.prototype.clone = function () {
    const result = BrandedAddress.clone(this);
    Object.setPrototypeOf(result, Address.prototype);
    // biome-ignore lint/suspicious/noExplicitAny: wasm interface requires any
    const crypto = this._crypto;
    if (crypto) {
        Object.defineProperty(result, "_crypto", {
            value: crypto,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }
    return result;
};
Address.prototype.calculateCreateAddress = function (nonce) {
    // biome-ignore lint/suspicious/noExplicitAny: wasm interface requires any
    const crypto = this._crypto;
    if (!crypto?.keccak256) {
        throw new InvalidValueError("keccak256 not provided to Address constructor. Pass { keccak256, rlpEncode } to enable calculateCreateAddress()", {
            value: undefined,
            expected: "keccak256 hash function",
            code: -32602,
        });
    }
    if (!crypto?.rlpEncode) {
        throw new InvalidValueError("rlpEncode not provided to Address constructor. Pass { keccak256, rlpEncode } to enable calculateCreateAddress()", {
            value: undefined,
            expected: "rlpEncode function",
            code: -32602,
        });
    }
    // Manual implementation using crypto deps
    if (nonce < 0n) {
        throw new InvalidValueError("Nonce cannot be negative", {
            value: nonce,
            expected: "non-negative bigint",
            code: -32602,
        });
    }
    // Encode nonce
    function encodeNonce(num) {
        if (num === 0n)
            return new Uint8Array(0);
        let n = num;
        let byteCount = 0;
        while (n > 0n) {
            byteCount++;
            n >>= 8n;
        }
        const bytes = new Uint8Array(byteCount);
        n = num;
        for (let i = byteCount - 1; i >= 0; i--) {
            bytes[i] = Number(n & 0xffn);
            n >>= 8n;
        }
        return bytes;
    }
    const nonceBytes = encodeNonce(nonce);
    const encoded = crypto.rlpEncode([this, nonceBytes]);
    const hash = crypto.keccak256(encoded);
    const result = hash.slice(12);
    Object.setPrototypeOf(result, Address.prototype);
    Object.defineProperty(result, "_crypto", {
        value: crypto,
        writable: false,
        enumerable: false,
        configurable: false,
    });
    return result;
};
Address.prototype.calculateCreate2Address = function (salt, initCode) {
    // biome-ignore lint/suspicious/noExplicitAny: wasm interface requires any
    const crypto = this._crypto;
    if (!crypto?.keccak256) {
        throw new InvalidValueError("keccak256 not provided to Address constructor. Pass { keccak256 } to enable calculateCreate2Address()", {
            value: undefined,
            expected: "keccak256 hash function",
            code: -32602,
        });
    }
    // Manual implementation using crypto deps
    const initCodeHash = crypto.keccak256(initCode);
    const data = new Uint8Array(1 + 20 + 32 + 32);
    data[0] = 0xff;
    data.set(this, 1);
    data.set(salt, 21);
    data.set(initCodeHash, 53);
    const hash = crypto.keccak256(data);
    const result = hash.slice(12);
    Object.setPrototypeOf(result, Address.prototype);
    Object.defineProperty(result, "_crypto", {
        value: crypto,
        writable: false,
        enumerable: false,
        configurable: false,
    });
    return result;
};
// Default export for dynamic imports
export default Address;
