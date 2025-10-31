/**
 * Address Types and Utilities
 *
 * Ethereum address (20 bytes) with type-safe operations.
 * All types namespaced under Address for intuitive access.
 *
 * @example
 * ```typescript
 * import { Address } from './address.js';
 *
 * // Create Address
 * const addr: Address = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 *
 * // Operations with this: pattern
 * const hex = Address.toHex.call(addr);
 * const checksummed = Address.toChecksumHex.call(addr);
 * ```
 */

import type { Hex } from "./hex.js";
import { Rlp } from "./rlp.js";
import { Hash } from "./hash.js";

// ============================================================================
// Main Address Namespace
// ============================================================================

export namespace Address {
  // ==========================================================================
  // Core Constants
  // ==========================================================================

  export const SIZE = 20;
  export const HEX_SIZE = 42; // 0x + 40 hex chars

  // ==========================================================================
  // Error Types
  // ==========================================================================

  export class InvalidHexFormatError extends Error {
    constructor(message = "Invalid hex format for address") {
      super(message);
      this.name = "InvalidHexFormatError";
    }
  }

  export class InvalidHexStringError extends Error {
    constructor(message = "Invalid hex string") {
      super(message);
      this.name = "InvalidHexStringError";
    }
  }

  export class InvalidAddressLengthError extends Error {
    constructor(message = "Invalid address length") {
      super(message);
      this.name = "InvalidAddressLengthError";
    }
  }

  export class InvalidValueError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "InvalidValueError";
    }
  }

  export class NotImplementedError extends Error {
    constructor(message = "Not implemented") {
      super(message);
      this.name = "NotImplementedError";
    }
  }

  // ==========================================================================
  // Branded Types
  // ==========================================================================

  /**
   * EIP-55 checksummed address hex string
   */
  export type ChecksumHex = Hex & { readonly __checksummed: true };

  // ==========================================================================
  // Universal Constructor
  // ==========================================================================

  /**
   * Create Address from various input types (universal constructor)
   *
   * @param value - Number, bigint, hex string, or Uint8Array
   * @returns Address
   * @throws {InvalidValueError} If value type is unsupported or invalid
   * @throws {InvalidHexFormatError} If hex string is invalid
   * @throws {InvalidAddressLengthError} If bytes length is not 20
   *
   * @example
   * ```typescript
   * const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
   * const addr2 = Address.from(12345);
   * const _addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
   * const addr4 = Address.from(new Uint8Array(20));
   * ```
   */
  export function from(value: number | bigint | string | Uint8Array): Address {
    // Route to appropriate from* method based on type
    if (typeof value === "number" || typeof value === "bigint") {
      return fromNumber(value);
    } else if (typeof value === "string") {
      return fromHex(value);
    } else if (value instanceof Uint8Array) {
      return fromBytes(value);
    } else {
      throw new InvalidValueError("Unsupported address value type");
    }
  }

  // ==========================================================================
  // Conversion Operations
  // ==========================================================================

  /**
   * Parse hex string to Address (standard form)
   *
   * @param hex - Hex string with 0x prefix
   * @returns Address bytes
   * @throws If invalid format or length
   *
   * @example
   * ```typescript
   * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
   * ```
   */
  export function fromHex(hex: string): Address {
    if (!hex.startsWith("0x") || hex.length !== HEX_SIZE) {
      throw new InvalidHexFormatError();
    }
    // Validate hex characters
    const hexPart = hex.slice(2);
    if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) {
      throw new InvalidHexStringError();
    }
    const bytes = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      const byte = Number.parseInt(hexPart.slice(i * 2, i * 2 + 2), 16);
      bytes[i] = byte;
    }
    return bytes as Address;
  }

  /**
   * Create Address from raw bytes (standard form)
   *
   * @param bytes - Raw 20-byte array
   * @returns Address
   * @throws If length is not 20 bytes
   *
   * @example
   * ```typescript
   * const bytes = new Uint8Array(20);
   * const addr = Address.fromBytes(bytes);
   * ```
   */
  export function fromBytes(bytes: Uint8Array): Address {
    if (bytes.length !== SIZE) {
      throw new InvalidAddressLengthError();
    }
    return new Uint8Array(bytes) as Address;
  }

  /**
   * Create Address from number value (takes lower 160 bits) (standard form)
   *
   * @param value - Number or bigint value
   * @returns Address from lower 160 bits
   * @throws {InvalidValueError} If value is negative
   *
   * @example
   * ```typescript
   * const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
   * const addr2 = Address.fromNumber(12345);
   * ```
   */
  export function fromNumber(value: bigint | number): Address {
    // Convert number to bigint if needed
    const bigintValue = typeof value === "number" ? BigInt(value) : value;

    // Validate non-negative
    if (bigintValue < 0n) {
      throw new InvalidValueError("Address value cannot be negative");
    }

    const bytes = new Uint8Array(SIZE);
    let v = bigintValue & ((1n << 160n) - 1n);
    for (let i = 19; i >= 0; i--) {
      bytes[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return bytes as Address;
  }

  /**
   * Create Address from secp256k1 public key (standard form)
   *
   * @param x - Public key x coordinate
   * @param y - Public key y coordinate
   * @returns Address derived from keccak256(pubkey)[12:32]
   *
   * @example
   * ```typescript
   * const addr = Address.fromPublicKey(xCoord, yCoord);
   * ```
   */
  export function fromPublicKey(x: bigint, y: bigint): Address {
    // Encode uncompressed public key (64 bytes: 32 bytes x + 32 bytes y)
    const pubkey = new Uint8Array(64);
    for (let i = 31; i >= 0; i--) {
      pubkey[31 - i] = Number((x >> BigInt(i * 8)) & 0xffn);
      pubkey[63 - i] = Number((y >> BigInt(i * 8)) & 0xffn);
    }
    // Address = keccak256(pubkey)[12:32]
    const hash = Hash.keccak256(pubkey) as unknown as Uint8Array;
    return hash.slice(12, 32) as Address;
  }

  /**
   * Convert Address to hex string
   *
   * @returns Lowercase hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const hex = Address.toHex.call(addr);
   * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
   * ```
   */
  export function toHex(this: Address): Hex {
    return `0x${Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
  }

  /**
   * Convert Address to EIP-55 checksummed hex string
   *
   * @returns Checksummed hex string with mixed case
   *
   * @example
   * ```typescript
   * const checksummed = Address.toChecksumHex.call(addr);
   * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
   * ```
   */
  export function toChecksumHex(this: Address): ChecksumHex {
    const lower = toHex.call(this).slice(2);
    const hashBytes = Hash.keccak256(new TextEncoder().encode(lower)) as unknown as Uint8Array;
    const hashHex = Array.from(hashBytes, (b) => b.toString(16).padStart(2, "0")).join("");
    let result = "0x";
    for (let i = 0; i < 40; i++) {
      const ch = lower[i];
      if (ch !== undefined && ch >= "a" && ch <= "f") {
        const hv = Number.parseInt(hashHex[i] ?? "0", 16);
        result += hv >= 8 ? ch.toUpperCase() : ch;
      } else {
        result += ch ?? "";
      }
    }
    return result as ChecksumHex;
  }

  /**
   * Convert Address to uint256
   *
   * @returns Bigint representation
   *
   * @example
   * ```typescript
   * const value = Address.toU256.call(addr);
   * ```
   */
  export function toU256(this: Address): bigint {
    let result = 0n;
    for (let i = 0; i < SIZE; i++) {
      result = (result << 8n) | BigInt(this[i] ?? 0);
    }
    return result;
  }

  /**
   * Convert Address to ABI-encoded bytes (32 bytes, left-padded)
   *
   * Ethereum ABI encoding pads addresses to 32 bytes by prepending 12 zero bytes.
   *
   * @param this - Address to encode
   * @returns 32-byte ABI-encoded Uint8Array
   *
   * @example
   * ```typescript
   * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
   * const encoded = Address.toAbiEncoded.call(addr);
   * // encoded.length === 32
   * ```
   */
  export function toAbiEncoded(this: Address): Uint8Array {
    const result = new Uint8Array(32);
    result.set(this, 12); // Left-pad with 12 zero bytes
    return result;
  }

  /**
   * Decode Address from ABI-encoded bytes (32 bytes)
   *
   * Extracts the last 20 bytes from 32-byte ABI-encoded address data.
   *
   * @param bytes - 32-byte ABI-encoded data
   * @returns Decoded Address
   * @throws Error if bytes length is not 32
   *
   * @example
   * ```typescript
   * const encoded = new Uint8Array(32);
   * // ... set encoded[12:32] to address bytes ...
   * const addr = Address.fromAbiEncoded(encoded);
   * ```
   */
  export function fromAbiEncoded(bytes: Uint8Array): Address {
    if (bytes.length !== 32) {
      throw new Error(`ABI-encoded Address must be exactly 32 bytes, got ${bytes.length}`);
    }
    return bytes.slice(12, 32) as Address;
  }

  // ==========================================================================
  // Validation Operations
  // ==========================================================================

  /**
   * Check if address is zero address
   *
   * @returns True if all bytes are zero
   *
   * @example
   * ```typescript
   * if (Address.isZero.call(addr)) {
   *   console.log("Zero address");
   * }
   * ```
   */
  export function isZero(this: Address): boolean {
    return this.every((b) => b === 0);
  }

  /**
   * Check if two addresses are equal
   *
   * @param other - Address to compare with
   * @returns True if addresses are identical
   *
   * @example
   * ```typescript
   * if (Address.equals.call(addr1, addr2)) {
   *   console.log("Addresses match");
   * }
   * ```
   */
  export function equals(this: Address, other: Address): boolean {
    if (this.length !== other.length) return false;
    for (let i = 0; i < this.length; i++) {
      if (this[i] !== other[i]) return false;
    }
    return true;
  }

  /**
   * Check if string is valid address format (standard form)
   *
   * @param str - String to validate
   * @returns True if valid hex format (with or without 0x)
   *
   * @example
   * ```typescript
   * if (Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
   *   const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
   * }
   * ```
   */
  export function isValid(str: string): boolean {
    if (!str.startsWith("0x")) {
      return str.length === 40 && /^[0-9a-fA-F]{40}$/.test(str);
    }
    return str.length === HEX_SIZE && /^0x[0-9a-fA-F]{40}$/.test(str);
  }

  /**
   * Check if string has valid EIP-55 checksum (standard form)
   *
   * @param str - Address string to validate
   * @returns True if checksum is valid
   *
   * @example
   * ```typescript
   * if (Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
   *   console.log("Valid checksum");
   * }
   * ```
   */
  export function isValidChecksum(str: string): boolean {
    if (!isValid(str)) return false;
    try {
      const addr = fromHex(str.startsWith("0x") ? str : `0x${str}`);
      const checksummed = toChecksumHex.call(addr) as string;
      return checksummed === (str.startsWith("0x") ? str : `0x${str}`);
    } catch {
      return false;
    }
  }

  /**
   * Type guard for Address (standard form)
   *
   * @param value - Value to check
   * @returns True if value is an Address
   *
   * @example
   * ```typescript
   * if (Address.is(value)) {
   *   const hex = Address.toHex(value);
   * }
   * ```
   */
  export function is(value: unknown): value is Address {
    return value instanceof Uint8Array && value.length === SIZE;
  }

  // ==========================================================================
  // Special Address Operations
  // ==========================================================================

  /**
   * Create zero address (standard form)
   *
   * @returns Zero address (0x0000...0000)
   *
   * @example
   * ```typescript
   * const zero = Address.zero();
   * ```
   */
  export function zero(): Address {
    return new Uint8Array(SIZE) as Address;
  }

  // ==========================================================================
  // Contract Address Calculation
  // ==========================================================================

  /**
   * Calculate CREATE contract address
   *
   * address = keccak256(rlp([sender, nonce]))[12:32]
   *
   * @param nonce - Transaction nonce
   * @returns Calculated contract address
   * @throws {InvalidValueError} If nonce is negative
   *
   * @example
   * ```typescript
   * const contractAddr = Address.calculateCreateAddress.call(deployerAddr, 5n);
   * ```
   */
  export function calculateCreateAddress(this: Address, nonce: bigint): Address {
    // Validate non-negative nonce
    if (nonce < 0n) {
      throw new InvalidValueError("Nonce cannot be negative");
    }

    // Convert nonce to big-endian bytes and strip leading zeros
    let nonceBytes: Uint8Array;
    if (nonce === 0n) {
      // Special case: nonce 0 encodes as empty bytes for RLP
      nonceBytes = new Uint8Array(0);
    } else {
      // Find minimum bytes needed to represent nonce
      const hex = nonce.toString(16);
      const hexPadded = hex.length % 2 === 0 ? hex : `0${hex}`;
      const byteLength = hexPadded.length / 2;
      nonceBytes = new Uint8Array(byteLength);
      for (let i = 0; i < byteLength; i++) {
        nonceBytes[i] = Number.parseInt(hexPadded.slice(i * 2, i * 2 + 2), 16);
      }
    }

    // RLP encode [sender_address, nonce]
    const encoded = Rlp.encode.call([this, nonceBytes]);

    // Hash the encoded data
    const hash = Hash.keccak256(encoded) as unknown as Uint8Array;

    // Return bytes 12-32 (last 20 bytes) as Address
    return hash.slice(12, 32) as Address;
  }

  /**
   * Calculate CREATE2 contract address
   *
   * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
   *
   * @param salt - 32-byte salt
   * @param initCode - Contract initialization code
   * @returns Calculated contract address
   *
   * @example
   * ```typescript
   * const contractAddr = Address.calculateCreate2Address.call(
   *   deployerAddr,
   *   saltBytes,
   *   initCode
   * );
   * ```
   */
  export function calculateCreate2Address(
    this: Address,
    salt: Uint8Array,
    initCode: Uint8Array,
  ): Address {
    if (salt.length !== 32) {
      throw new Error("Salt must be 32 bytes");
    }

    // address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
    const initCodeHash = Hash.keccak256(initCode) as unknown as Uint8Array;
    const data = new Uint8Array(1 + SIZE + 32 + 32);
    data[0] = 0xff;
    data.set(this, 1);
    data.set(salt, 1 + SIZE);
    data.set(initCodeHash, 1 + SIZE + 32);

    const hash = Hash.keccak256(data) as unknown as Uint8Array;
    return hash.slice(12, 32) as Address;
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Compare two addresses lexicographically
   *
   * @param other - Address to compare with
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   *
   * @example
   * ```typescript
   * const sorted = addresses.sort((a, b) => Address.compare.call(a, b));
   * ```
   */
  export function compare(this: Address, other: Address): number {
    for (let i = 0; i < SIZE; i++) {
      const thisByte = this[i] ?? 0;
      const otherByte = other[i] ?? 0;
      if (thisByte < otherByte) return -1;
      if (thisByte > otherByte) return 1;
    }
    return 0;
  }

  /**
   * Check if this address is less than other
   *
   * @param other - Address to compare with
   * @returns True if this < other
   */
  export function lessThan(this: Address, other: Address): boolean {
    return compare.call(this, other) < 0;
  }

  /**
   * Check if this address is greater than other
   *
   * @param other - Address to compare with
   * @returns True if this > other
   */
  export function greaterThan(this: Address, other: Address): boolean {
    return compare.call(this, other) > 0;
  }

  // ==========================================================================
  // Formatting Operations
  // ==========================================================================

  /**
   * Format address with shortened display
   *
   * @param prefixLength - Number of chars to show at start (default: 6)
   * @param suffixLength - Number of chars to show at end (default: 4)
   * @returns Shortened address like "0x742d...51e3"
   *
   * @example
   * ```typescript
   * const short = Address.toShortHex.call(addr);
   * // "0x742d...51e3"
   * const custom = Address.toShortHex.call(addr, 8, 6);
   * // "0x742d35...251e3"
   * ```
   */
  export function toShortHex(this: Address, prefixLength?: number, suffixLength?: number): string {
    const prefix = prefixLength ?? 6;
    const suffix = suffixLength ?? 4;

    const hex = toHex.call(this);
    if (prefix + suffix >= 40) return hex;
    return `${hex.slice(0, 2 + prefix)}...${hex.slice(-suffix)}`;
  }

  /**
   * Format address for display (checksummed)
   *
   * @returns Checksummed hex string
   *
   * @example
   * ```typescript
   * console.log(Address.format.call(addr));
   * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
   * ```
   */
  export function format(this: Address): string {
    return toChecksumHex.call(this);
  }
}

/**
 * Address type - 20-byte Ethereum address
 *
 * Uses TypeScript declaration merging - Address is both a namespace and a type.
 */
export type Address = Uint8Array & { readonly __tag: "Address" };

// Re-export namespace as default
export default Address;
