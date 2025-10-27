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
 * // Types
 * const addr: Address = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 *
 * // Operations - standard form
 * const hex = Address.toHex(addr);
 * const checksummed = Address.toChecksumHex(addr);
 *
 * // Operations - convenience form with this:
 * const hex2 = Address.toHex.call(addr);
 * const checksummed2 = Address.toChecksumHex.call(addr);
 * ```
 */

import { keccak256 } from "../../crypto/keccak.js";

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
      throw new Error("InvalidHexFormat");
    }
    const bytes = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      const byte = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
      if (Number.isNaN(byte)) throw new Error("InvalidHexString");
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
      throw new Error("InvalidAddressLength");
    }
    return new Uint8Array(bytes) as Address;
  }

  /**
   * Create Address from uint256 value (takes lower 160 bits) (standard form)
   *
   * @param value - Bigint value
   * @returns Address from lower 160 bits
   *
   * @example
   * ```typescript
   * const addr = Address.fromU256(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
   * ```
   */
  export function fromU256(value: bigint): Address {
    const bytes = new Uint8Array(SIZE);
    let v = value & ((1n << 160n) - 1n);
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
    const hash = keccak256(pubkey) as unknown as Uint8Array;
    return hash.slice(12, 32) as Address;
  }

  /**
   * Convert Address to hex string (standard form)
   *
   * @param address - Address to convert
   * @returns Lowercase hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const hex = Address.toHex(addr);
   * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
   * ```
   */
  export function toHex(address: Address): string;
  export function toHex(this: Address): string;
  export function toHex(this: Address | void, address?: Address): string {
    const addr = address ?? (this as Address);
    return `0x${Array.from(addr, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }

  /**
   * Convert Address to EIP-55 checksummed hex string (standard form)
   *
   * @param address - Address to convert
   * @returns Checksummed hex string with mixed case
   *
   * @example
   * ```typescript
   * const checksummed = Address.toChecksumHex(addr);
   * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
   * ```
   */
  export function toChecksumHex(address: Address): string;
  export function toChecksumHex(this: Address): string;
  export function toChecksumHex(this: Address | void, address?: Address): string {
    const addr = address ?? (this as Address);
    const lower = toHex(addr).slice(2);
    const hashBytes = keccak256(new TextEncoder().encode(lower)) as unknown as Uint8Array;
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
    return result;
  }

  /**
   * Convert Address to uint256 (standard form)
   *
   * @param address - Address to convert
   * @returns Bigint representation
   *
   * @example
   * ```typescript
   * const value = Address.toU256(addr);
   * ```
   */
  export function toU256(address: Address): bigint;
  export function toU256(this: Address): bigint;
  export function toU256(this: Address | void, address?: Address): bigint {
    const addr = address ?? (this as Address);
    let result = 0n;
    for (let i = 0; i < SIZE; i++) {
      result = (result << 8n) | BigInt(addr[i] ?? 0);
    }
    return result;
  }

  // ==========================================================================
  // Validation Operations
  // ==========================================================================

  /**
   * Check if address is zero address (standard form)
   *
   * @param address - Address to check
   * @returns True if all bytes are zero
   *
   * @example
   * ```typescript
   * if (Address.isZero(addr)) {
   *   console.log("Zero address");
   * }
   * ```
   */
  export function isZero(this: Address, address?: Address): boolean {
    const addr = address ?? this;
    return addr.every((b) => b === 0);
  }

  /**
   * Check if two addresses are equal (standard form)
   *
   * @param a - First address
   * @param b - Second address
   * @returns True if addresses are identical
   *
   * @example
   * ```typescript
   * if (Address.equals(addr1, addr2)) {
   *   console.log("Addresses match");
   * }
   * ```
   */
  export function equals(this: Address, a: Address, b?: Address): boolean {
    const first = b === undefined ? this : a;
    const second = b === undefined ? a : b;
    if (first.length !== second.length) return false;
    for (let i = 0; i < first.length; i++) {
      if (first[i] !== second[i]) return false;
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
      const checksummed = toChecksumHex(addr) as string;
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
   * Calculate CREATE contract address (standard form)
   *
   * address = keccak256(rlp([sender, nonce]))[12:32]
   *
   * @param creator - Creator address
   * @param nonce - Transaction nonce
   * @returns Calculated contract address
   *
   * @example
   * ```typescript
   * const contractAddr = Address.calculateCreateAddress(deployerAddr, 5n);
   * ```
   */
  export function calculateCreateAddress(creator: Address, nonce: bigint): Address;
  export function calculateCreateAddress(this: Address, nonce: bigint): Address;
  export function calculateCreateAddress(
    this: Address | void,
    creatorOrNonce: Address | bigint,
    nonce?: bigint,
  ): Address {
    // TODO: Implement RLP encoding
    // const creatorAddr = nonce === undefined ? this as Address : creatorOrNonce as Address;
    // const nonceValue = nonce === undefined ? creatorOrNonce as bigint : nonce;
    // const rlp = rlpEncode([creatorAddr, nonceValue]);
    // const hash = keccak256(rlp);
    // return hash.slice(12, 32) as Address;
    throw new Error("Not implemented");
  }

  /**
   * Calculate CREATE2 contract address (standard form)
   *
   * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
   *
   * @param creator - Creator address
   * @param salt - 32-byte salt
   * @param initCode - Contract initialization code
   * @returns Calculated contract address
   *
   * @example
   * ```typescript
   * const contractAddr = Address.calculateCreate2Address(
   *   deployerAddr,
   *   saltBytes,
   *   initCode
   * );
   * ```
   */
  export function calculateCreate2Address(
    this: Address,
    creator: Address,
    salt: Uint8Array,
    initCode?: Uint8Array,
  ): Address {
    const creatorAddr = initCode === undefined ? this : creator;
    const saltValue = initCode === undefined ? creator : salt;
    const initCodeValue = initCode === undefined ? salt : initCode;

    if (saltValue.length !== 32) {
      throw new Error("Salt must be 32 bytes");
    }

    // address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
    const initCodeHash = keccak256(initCodeValue) as unknown as Uint8Array;
    const data = new Uint8Array(1 + SIZE + 32 + 32);
    data[0] = 0xff;
    data.set(creatorAddr, 1);
    data.set(saltValue, 1 + SIZE);
    data.set(initCodeHash, 1 + SIZE + 32);

    const hash = keccak256(data) as unknown as Uint8Array;
    return hash.slice(12, 32) as Address;
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Compare two addresses lexicographically (standard form)
   *
   * @param a - First address
   * @param b - Second address
   * @returns -1 if a < b, 0 if equal, 1 if a > b
   *
   * @example
   * ```typescript
   * const sorted = addresses.sort((a, b) => Address.compare(a, b));
   * ```
   */
  export function compare(a: Address, b: Address): number;
  export function compare(this: Address, b: Address): number;
  export function compare(this: Address | void, a: Address, b?: Address): number {
    const first = b === undefined ? (this as Address) : a;
    const second = b === undefined ? a : b;
    for (let i = 0; i < SIZE; i++) {
      const firstByte = first[i] ?? 0;
      const secondByte = second[i] ?? 0;
      if (firstByte < secondByte) return -1;
      if (firstByte > secondByte) return 1;
    }
    return 0;
  }

  /**
   * Check if first address is less than second (standard form)
   *
   * @param a - First address
   * @param b - Second address
   * @returns True if a < b
   */
  export function lessThan(a: Address, b: Address): boolean;
  export function lessThan(this: Address, b: Address): boolean;
  export function lessThan(this: Address | void, a: Address, b?: Address): boolean {
    return compare(a, b ?? a) < 0;
  }

  /**
   * Check if first address is greater than second (standard form)
   *
   * @param a - First address
   * @param b - Second address
   * @returns True if a > b
   */
  export function greaterThan(a: Address, b: Address): boolean;
  export function greaterThan(this: Address, b: Address): boolean;
  export function greaterThan(this: Address | void, a: Address, b?: Address): boolean {
    return compare(a, b ?? a) > 0;
  }

  // ==========================================================================
  // Formatting Operations
  // ==========================================================================

  /**
   * Format address with shortened display (standard form)
   *
   * @param address - Address to format
   * @param prefixLength - Number of chars to show at start (default: 6)
   * @param suffixLength - Number of chars to show at end (default: 4)
   * @returns Shortened address like "0x742d...51e3"
   *
   * @example
   * ```typescript
   * const short = Address.toShortHex(addr);
   * // "0x742d...51e3"
   * const custom = Address.toShortHex(addr, 8, 6);
   * // "0x742d35...251e3"
   * ```
   */
  export function toShortHex(address: Address, prefixLength?: number, suffixLength?: number): string;
  export function toShortHex(this: Address, prefixLength?: number, suffixLength?: number): string;
  export function toShortHex(
    this: Address | void,
    address?: Address | number,
    prefixLength?: number,
    suffixLength?: number,
  ): string {
    // Handle overloads
    const addr =
      typeof address === "number" || address === undefined ? (this as Address) : address;
    const prefix =
      typeof address === "number" ? address : prefixLength ?? 6;
    const suffix = suffixLength ?? 4;

    const hex = toHex(addr);
    if (prefix + suffix >= 40) return hex;
    return `${hex.slice(0, 2 + prefix)}...${hex.slice(-suffix)}`;
  }

  /**
   * Format address for display (checksummed) (standard form)
   *
   * @param address - Address to format
   * @returns Checksummed hex string
   *
   * @example
   * ```typescript
   * console.log(Address.format(addr));
   * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
   * ```
   */
  export function format(address: Address): string;
  export function format(this: Address): string;
  export function format(this: Address | void, address?: Address): string {
    const addr = address ?? (this as Address);
    return toChecksumHex(addr);
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
