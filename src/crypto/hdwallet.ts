/**
 * HD Wallet (Hierarchical Deterministic Wallets) Implementation
 *
 * Implements BIP-32 (HD key derivation) and BIP-44 (multi-account hierarchy)
 * for deterministic key generation from a single seed.
 *
 * Uses @scure/bip32 - audited, widely-used implementation by Paul Miller.
 *
 * @example
 * ```typescript
 * import { HDWallet } from './hdwallet.js';
 * import { Bip39 } from './bip39.js';
 *
 * // From mnemonic
 * const mnemonic = Bip39.generateMnemonic(256);
 * const seed = await Bip39.mnemonicToSeed(mnemonic);
 * const root = HDWallet.fromSeed(seed);
 *
 * // Derive Ethereum account (BIP-44)
 * const account0 = root.derivePath("m/44'/60'/0'/0/0");
 * console.log(account0.privateKey); // Uint8Array(32)
 * console.log(account0.publicKey);  // Uint8Array(33)
 * ```
 */

import { HDKey } from "@scure/bip32";

// ============================================================================
// Error Types
// ============================================================================

export class HDWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HDWalletError";
  }
}

export class InvalidPathError extends HDWalletError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPathError";
  }
}

export class InvalidSeedError extends HDWalletError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSeedError";
  }
}

// ============================================================================
// Main HDWallet Namespace
// ============================================================================

export namespace HDWallet {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  export type ExtendedKey = HDKey;
  export type Path = string;
  export type Seed = Uint8Array;
  export type PrivateKey = Uint8Array | null;
  export type PublicKey = Uint8Array | null;
  export type ChainCode = Uint8Array | null;

  // ==========================================================================
  // Constants
  // ==========================================================================

  /** First hardened child index */
  export const HARDENED_OFFSET = 0x80000000;

  /** Standard BIP-44 coin types */
  export const CoinType = {
    /** Bitcoin */
    BTC: 0,
    /** Bitcoin Testnet */
    BTC_TESTNET: 1,
    /** Ethereum */
    ETH: 60,
    /** Ethereum Classic */
    ETC: 61,
  } as const;

  /**
   * Standard BIP-44 path templates
   * Format: m / purpose' / coin_type' / account' / change / address_index
   */
  export const BIP44_PATH = {
    /** Ethereum: m/44'/60'/0'/0/x */
    ETH: (account: number = 0, index: number = 0) =>
      `m/44'/60'/${account}'/0/${index}`,
    /** Bitcoin: m/44'/0'/0'/0/x */
    BTC: (account: number = 0, index: number = 0) =>
      `m/44'/0'/${account}'/0/${index}`,
  } as const;

  // ==========================================================================
  // Key Generation
  // ==========================================================================

  /**
   * Create root HD key from seed
   *
   * @param seed - BIP-39 seed (typically 64 bytes)
   * @returns Root extended key
   *
   * @example
   * ```typescript
   * const seed = await Bip39.mnemonicToSeed(mnemonic);
   * const root = HDWallet.fromSeed(seed);
   * ```
   */
  export function fromSeed(seed: Seed): ExtendedKey {
    if (seed.length < 16 || seed.length > 64) {
      throw new InvalidSeedError("Seed must be between 16 and 64 bytes");
    }

    try {
      return HDKey.fromMasterSeed(seed);
    } catch (error) {
      throw new HDWalletError(`Failed to create HD key from seed: ${error}`);
    }
  }

  /**
   * Create HD key from extended private key (xprv)
   *
   * @param xprv - Base58-encoded extended private key
   * @returns Extended key
   *
   * @example
   * ```typescript
   * const key = HDWallet.fromExtendedKey("xprv...");
   * ```
   */
  export function fromExtendedKey(xprv: string): ExtendedKey {
    try {
      return HDKey.fromExtendedKey(xprv);
    } catch (error) {
      throw new HDWalletError(`Invalid extended key: ${error}`);
    }
  }

  /**
   * Create HD key from extended public key (xpub)
   *
   * Note: Cannot derive hardened children from public keys
   *
   * @param xpub - Base58-encoded extended public key
   * @returns Extended key (public only)
   *
   * @example
   * ```typescript
   * const pubKey = HDWallet.fromPublicExtendedKey("xpub...");
   * ```
   */
  export function fromPublicExtendedKey(xpub: string): ExtendedKey {
    try {
      return HDKey.fromExtendedKey(xpub);
    } catch (error) {
      throw new HDWalletError(`Invalid extended public key: ${error}`);
    }
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  /**
   * Derive child key from parent using BIP-32 path
   *
   * @param key - Parent extended key
   * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0")
   * @returns Derived extended key
   *
   * @example
   * ```typescript
   * const root = HDWallet.fromSeed(seed);
   * const child = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
   * ```
   */
  export function derivePath(key: ExtendedKey, path: Path): ExtendedKey {
    try {
      return key.derive(path);
    } catch (error) {
      throw new InvalidPathError(`Invalid derivation path "${path}": ${error}`);
    }
  }

  /**
   * Derive child key by index
   *
   * @param key - Parent extended key
   * @param index - Child index (use HARDENED_OFFSET for hardened derivation)
   * @returns Derived extended key
   *
   * @example
   * ```typescript
   * // Normal derivation
   * const child = HDWallet.deriveChild(key, 0);
   *
   * // Hardened derivation
   * const hardenedChild = HDWallet.deriveChild(key, HDWallet.HARDENED_OFFSET);
   * ```
   */
  export function deriveChild(key: ExtendedKey, index: number): ExtendedKey {
    try {
      return key.deriveChild(index);
    } catch (error) {
      throw new HDWalletError(`Failed to derive child at index ${index}: ${error}`);
    }
  }

  // ==========================================================================
  // BIP-44 Helpers
  // ==========================================================================

  /**
   * Derive Ethereum address key using BIP-44
   *
   * Path: m/44'/60'/account'/0/index
   *
   * @param key - Root HD key
   * @param account - Account index (default: 0)
   * @param index - Address index (default: 0)
   * @returns Derived key for Ethereum address
   *
   * @example
   * ```typescript
   * const root = HDWallet.fromSeed(seed);
   * const ethKey0 = HDWallet.deriveEthereum(root, 0, 0);
   * const ethKey1 = HDWallet.deriveEthereum(root, 0, 1);
   * ```
   */
  export function deriveEthereum(
    key: ExtendedKey,
    account: number = 0,
    index: number = 0,
  ): ExtendedKey {
    const path = BIP44_PATH.ETH(account, index);
    return derivePath(key, path);
  }

  /**
   * Derive Bitcoin address key using BIP-44
   *
   * Path: m/44'/0'/account'/0/index
   *
   * @param key - Root HD key
   * @param account - Account index (default: 0)
   * @param index - Address index (default: 0)
   * @returns Derived key for Bitcoin address
   *
   * @example
   * ```typescript
   * const root = HDWallet.fromSeed(seed);
   * const btcKey = HDWallet.deriveBitcoin(root, 0, 0);
   * ```
   */
  export function deriveBitcoin(
    key: ExtendedKey,
    account: number = 0,
    index: number = 0,
  ): ExtendedKey {
    const path = BIP44_PATH.BTC(account, index);
    return derivePath(key, path);
  }

  // ==========================================================================
  // Key Serialization
  // ==========================================================================

  /**
   * Serialize extended private key to base58 (xprv)
   *
   * @param key - Extended key
   * @returns Base58-encoded extended private key
   *
   * @example
   * ```typescript
   * const xprv = HDWallet.toExtendedPrivateKey(key);
   * ```
   */
  export function toExtendedPrivateKey(key: ExtendedKey): string {
    if (!key.privateKey) {
      throw new HDWalletError("Key does not have a private key");
    }
    return key.privateExtendedKey;
  }

  /**
   * Serialize extended public key to base58 (xpub)
   *
   * @param key - Extended key
   * @returns Base58-encoded extended public key
   *
   * @example
   * ```typescript
   * const xpub = HDWallet.toExtendedPublicKey(key);
   * ```
   */
  export function toExtendedPublicKey(key: ExtendedKey): string {
    if (!key.publicKey) {
      throw new HDWalletError("Key does not have a public key");
    }
    return key.publicExtendedKey;
  }

  // ==========================================================================
  // Key Properties
  // ==========================================================================

  /**
   * Get private key bytes
   *
   * @param key - Extended key
   * @returns 32-byte private key or null if public-only key
   *
   * @example
   * ```typescript
   * const privKey = HDWallet.getPrivateKey(key);
   * ```
   */
  export function getPrivateKey(key: ExtendedKey): PrivateKey {
    return key.privateKey;
  }

  /**
   * Get public key bytes
   *
   * @param key - Extended key
   * @returns 33-byte compressed public key or null
   *
   * @example
   * ```typescript
   * const pubKey = HDWallet.getPublicKey(key);
   * ```
   */
  export function getPublicKey(key: ExtendedKey): PublicKey {
    return key.publicKey;
  }

  /**
   * Get chain code
   *
   * @param key - Extended key
   * @returns 32-byte chain code
   *
   * @example
   * ```typescript
   * const chainCode = HDWallet.getChainCode(key);
   * ```
   */
  export function getChainCode(key: ExtendedKey): ChainCode {
    return key.chainCode;
  }

  /**
   * Check if key can derive hardened children
   *
   * @param key - Extended key
   * @returns True if key has private key, false if public-only
   *
   * @example
   * ```typescript
   * if (HDWallet.canDeriveHardened(key)) {
   *   const hardened = key.deriveChild(HDWallet.HARDENED_OFFSET);
   * }
   * ```
   */
  export function canDeriveHardened(key: ExtendedKey): boolean {
    return key.privateKey !== null;
  }

  /**
   * Create public-only version of key (neutered key)
   *
   * @param key - Extended key
   * @returns Public-only extended key
   *
   * @example
   * ```typescript
   * const pubOnlyKey = HDWallet.toPublic(key);
   * ```
   */
  export function toPublic(key: ExtendedKey): ExtendedKey {
    if (!key.publicKey) {
      throw new HDWalletError("Key does not have a public key");
    }
    // Create a new HD key from the public key
    const xpub = key.publicExtendedKey;
    return HDKey.fromExtendedKey(xpub);
  }

  // ==========================================================================
  // Path Utilities
  // ==========================================================================

  /**
   * Check if path uses hardened derivation
   *
   * @param path - BIP-32 path
   * @returns True if path contains hardened derivation (')
   *
   * @example
   * ```typescript
   * HDWallet.isHardenedPath("m/44'/60'/0'"); // true
   * HDWallet.isHardenedPath("m/44/60/0");    // false
   * ```
   */
  export function isHardenedPath(path: Path): boolean {
    return path.includes("'") || path.includes("h");
  }

  /**
   * Validate BIP-32 path format
   *
   * @param path - Path to validate
   * @returns True if valid BIP-32 path
   *
   * @example
   * ```typescript
   * HDWallet.isValidPath("m/44'/60'/0'/0/0"); // true
   * HDWallet.isValidPath("invalid");          // false
   * ```
   */
  export function isValidPath(path: Path): boolean {
    // Basic BIP-32 path format check
    const pathRegex = /^m(\/\d+'?)+$/;
    return pathRegex.test(path);
  }

  /**
   * Parse hardened index notation
   *
   * @param indexStr - Index string (e.g., "0" or "0'" or "0h")
   * @returns Numeric index
   *
   * @example
   * ```typescript
   * HDWallet.parseIndex("0");   // 0
   * HDWallet.parseIndex("0'");  // 2147483648 (0x80000000)
   * HDWallet.parseIndex("0h");  // 2147483648 (0x80000000)
   * ```
   */
  export function parseIndex(indexStr: string): number {
    const hardened = indexStr.endsWith("'") || indexStr.endsWith("h");
    const index = parseInt(indexStr.replace(/['h]$/, ""), 10);

    if (isNaN(index) || index < 0) {
      throw new InvalidPathError(`Invalid index: ${indexStr}`);
    }

    return hardened ? index + HARDENED_OFFSET : index;
  }
}
