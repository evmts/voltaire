/**
 * EIP-7702 Authorization List
 *
 * Set EOA code authorization for account abstraction.
 * All types and operations namespaced under Authorization for intuitive access.
 *
 * @example
 * ```typescript
 * import { Authorization } from './authorization.js';
 *
 * // Types
 * const auth: Authorization.Item = { chainId: 1n, address, nonce: 0n, yParity: 0, r: 0n, s: 0n };
 *
 * // Operations using this: pattern
 * Authorization.validate.call(auth);
 * const sigHash = Authorization.hash.call(auth);
 * const authority = Authorization.verify.call(auth);
 * ```
 */

import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// ============================================================================
// Main Authorization Namespace
// ============================================================================

export namespace Authorization {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * EIP-7702 Authorization
   * Allows EOA to delegate code execution to another address
   */
  export type Item = {
    /** Chain ID where authorization is valid */
    chainId: bigint;
    /** Address to delegate code execution to */
    address: Address;
    /** Nonce of the authorizing account */
    nonce: bigint;
    /** Signature Y parity (0 or 1) */
    yParity: number;
    /** Signature r value */
    r: bigint;
    /** Signature s value */
    s: bigint;
  };

  /**
   * Authorization without signature (for hashing)
   */
  export type Unsigned = {
    chainId: bigint;
    address: Address;
    nonce: bigint;
  };

  /**
   * Delegation designation result
   */
  export type DelegationDesignation = {
    /** Authority (signer) address */
    authority: Address;
    /** Delegated code address */
    delegatedAddress: Address;
  };

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * EIP-7702 magic byte for signing hash
   */
  export const MAGIC_BYTE = 0x05;

  /**
   * Gas cost per empty account authorization
   */
  export const PER_EMPTY_ACCOUNT_COST = 25000n;

  /**
   * Base gas cost per authorization
   */
  export const PER_AUTH_BASE_COST = 12500n;

  /**
   * secp256k1 curve order N
   */
  export const SECP256K1_N =
    0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

  /**
   * secp256k1 curve order N / 2 (for malleability check)
   */
  export const SECP256K1_HALF_N = SECP256K1_N >> 1n;

  // ==========================================================================
  // Error Types
  // ==========================================================================

  /**
   * Authorization validation error
   */
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthorizationValidationError";
    }
  }

  // ==========================================================================
  // Type Guards
  // ==========================================================================

  /**
   * Check if value is Authorization.Item
   *
   * @param value - Value to check
   * @returns True if value is Authorization.Item
   *
   * @example
   * ```typescript
   * const value: unknown = {...};
   * if (Authorization.isItem(value)) {
   *   // value is Authorization.Item
   * }
   * ```
   *
   * Note: Type guards don't use this: pattern as they operate on unknown values
   */
  export function isItem(value: unknown): value is Item {
    if (typeof value !== "object" || value === null) return false;
    const auth = value as Partial<Item>;
    return (
      typeof auth.chainId === "bigint" &&
      typeof auth.address === "object" &&
      auth.address !== null &&
      "bytes" in auth.address &&
      typeof auth.nonce === "bigint" &&
      typeof auth.yParity === "number" &&
      typeof auth.r === "bigint" &&
      typeof auth.s === "bigint"
    );
  }

  /**
   * Check if value is Authorization.Unsigned
   *
   * @param value - Value to check
   * @returns True if value is Authorization.Unsigned
   *
   * Note: Type guards don't use this: pattern as they operate on unknown values
   */
  export function isUnsigned(value: unknown): value is Unsigned {
    if (typeof value !== "object" || value === null) return false;
    const auth = value as Partial<Unsigned>;
    return (
      typeof auth.chainId === "bigint" &&
      typeof auth.address === "object" &&
      auth.address !== null &&
      "bytes" in auth.address &&
      typeof auth.nonce === "bigint"
    );
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate authorization structure
   *
   * @throws ValidationError if invalid
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * try {
   *   Authorization.validate.call(auth);
   * } catch (e) {
   *   if (e instanceof Authorization.ValidationError) {
   *     console.error(e.message);
   *   }
   * }
   * ```
   */
  export function validate(this: Item): void {
    // Chain ID must be non-zero
    if (this.chainId === 0n) {
      throw new ValidationError("Chain ID must be non-zero");
    }

    // Address must not be zero
    if (this.address.bytes.every((byte) => byte === 0)) {
      throw new ValidationError("Address cannot be zero address");
    }

    // yParity must be 0 or 1
    if (this.yParity !== 0 && this.yParity !== 1) {
      throw new ValidationError("yParity must be 0 or 1");
    }

    // r and s must be non-zero
    if (this.r === 0n) {
      throw new ValidationError("Signature r cannot be zero");
    }
    if (this.s === 0n) {
      throw new ValidationError("Signature s cannot be zero");
    }

    // r must be < N
    if (this.r >= SECP256K1_N) {
      throw new ValidationError("Signature r must be less than curve order");
    }

    // s must be <= N/2 (no malleable signatures)
    if (this.s > SECP256K1_HALF_N) {
      throw new ValidationError("Signature s too high (malleable signature)");
    }
  }

  // ==========================================================================
  // Hashing
  // ==========================================================================

  /**
   * Calculate signing hash for authorization
   *
   * Hash = keccak256(MAGIC || rlp([chain_id, address, nonce]))
   *
   * @returns Hash to sign
   *
   * @example
   * ```typescript
   * const unsigned: Authorization.Unsigned = { chainId: 1n, address, nonce: 0n };
   * const sigHash = Authorization.hash.call(unsigned);
   * // Now sign sigHash with private key
   * ```
   */
  export function hash(this: Unsigned): Hash {
    // TODO: Implement keccak256(MAGIC || rlp([chain_id, address, nonce]))
    // 1. RLP encode [chainId, address.bytes, nonce]
    // 2. Prepend MAGIC_BYTE
    // 3. keccak256 hash
    throw new Error("Authorization.hash() not yet implemented");
  }

  // ==========================================================================
  // Creation
  // ==========================================================================

  /**
   * Create signed authorization from unsigned
   *
   * @param privateKey - Private key (32 bytes) for signing
   * @returns Signed authorization
   *
   * @example
   * ```typescript
   * const unsigned: Authorization.Unsigned = { chainId: 1n, address, nonce: 0n };
   * const auth = Authorization.sign.call(unsigned, privateKey);
   * ```
   */
  export function sign(this: Unsigned, privateKey: Uint8Array): Item {
    // TODO: Implement authorization creation with signing
    // 1. Hash this unsigned auth
    // 2. Sign hash with privateKey (secp256k1)
    // 3. Extract r, s, v from signature
    // 4. Return complete authorization
    throw new Error("Authorization.sign() not yet implemented");
  }

  // ==========================================================================
  // Verification
  // ==========================================================================

  /**
   * Verify authorization signature and recover authority
   *
   * @returns Recovered signer address (authority)
   * @throws ValidationError if validation fails
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const authority = Authorization.verify.call(auth);
   * console.log(`Authorized by: ${authority}`);
   * ```
   */
  export function verify(this: Item): Address {
    // Validate structure first
    validate.call(this);

    // TODO: Implement signature verification and recovery
    // 1. Hash unsigned portion
    // 2. Recover public key from signature (r, s, yParity) and hash
    // 3. Derive address from public key
    // 4. Return authority address
    throw new Error("Authorization.verify() not yet implemented");
  }

  // ==========================================================================
  // Gas Calculations
  // ==========================================================================

  /**
   * Calculate gas cost for authorization list
   *
   * @param emptyAccounts - Number of empty accounts being authorized
   * @returns Total gas cost
   *
   * @example
   * ```typescript
   * const authList: Authorization.Item[] = [...];
   * const gas = Authorization.calculateGasCost.call(authList, 2);
   * console.log(`Gas required: ${gas}`);
   * ```
   */
  export function calculateGasCost(this: Item[], emptyAccounts: number): bigint {
    const authCost = BigInt(this.length) * PER_AUTH_BASE_COST;
    const emptyCost = BigInt(emptyAccounts) * PER_EMPTY_ACCOUNT_COST;
    return authCost + emptyCost;
  }

  /**
   * Calculate gas cost for this authorization
   *
   * @param isEmpty - Whether the account is empty
   * @returns Gas cost for this authorization
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const gas = Authorization.getGasCost.call(auth, true);
   * ```
   */
  export function getGasCost(this: Item, isEmpty: boolean): bigint {
    return PER_AUTH_BASE_COST + (isEmpty ? PER_EMPTY_ACCOUNT_COST : 0n);
  }

  // ==========================================================================
  // Processing
  // ==========================================================================

  /**
   * Process authorization and return delegation designation
   *
   * @returns Delegation designation with authority and delegated address
   * @throws ValidationError if authorization is invalid
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const delegation = Authorization.process.call(auth);
   * console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
   * ```
   */
  export function process(this: Item): DelegationDesignation {
    // Validate and recover authority
    const authority = verify.call(this);

    return {
      authority,
      delegatedAddress: this.address,
    };
  }

  /**
   * Process authorization list and return all delegations
   *
   * @returns Array of delegation designations
   * @throws ValidationError if any authorization is invalid
   *
   * @example
   * ```typescript
   * const authList: Authorization.Item[] = [...];
   * const delegations = Authorization.processAll.call(authList);
   * delegations.forEach(d => {
   *   console.log(`${d.authority} -> ${d.delegatedAddress}`);
   * });
   * ```
   */
  export function processAll(this: Item[]): DelegationDesignation[] {
    return this.map((auth) => process.call(auth));
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Format authorization to human-readable string
   *
   * @returns Human-readable string
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * console.log(Authorization.format.call(auth));
   * // "Authorization(chain=1, to=0x..., nonce=0)"
   * ```
   */
  export function format(this: Item | Unsigned): string {
    if ("r" in this && "s" in this) {
      return `Authorization(chain=${this.chainId}, to=${formatAddress(
        this.address,
      )}, nonce=${this.nonce}, r=0x${this.r.toString(16)}, s=0x${this.s.toString(
        16,
      )}, v=${this.yParity})`;
    }
    return `Authorization(chain=${this.chainId}, to=${formatAddress(
      this.address,
    )}, nonce=${this.nonce})`;
  }

  /**
   * Helper to format address (shortened)
   */
  function formatAddress(addr: Address): string {
    const hex = Array.from(addr.bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
  }

  /**
   * Check if this authorization equals another
   *
   * @param other - Other authorization to compare
   * @returns True if equal
   *
   * @example
   * ```typescript
   * const auth1: Authorization.Item = {...};
   * const auth2: Authorization.Item = {...};
   * if (Authorization.equals.call(auth1, auth2)) {
   *   console.log('Authorizations are equal');
   * }
   * ```
   */
  export function equals(this: Item, other: Item): boolean {
    return (
      this.chainId === other.chainId &&
      addressesEqual(this.address, other.address) &&
      this.nonce === other.nonce &&
      this.yParity === other.yParity &&
      this.r === other.r &&
      this.s === other.s
    );
  }

  /**
   * Helper to check address equality
   */
  function addressesEqual(a: Address, b: Address): boolean {
    if (a.bytes.length !== b.bytes.length) return false;
    for (let i = 0; i < a.bytes.length; i++) {
      if (a.bytes[i] !== b.bytes[i]) return false;
    }
    return true;
  }
}

/**
 * Authorization type alias
 *
 * Uses TypeScript declaration merging - Authorization is both a namespace and a type.
 */
export type Authorization = Authorization.Item;

// Re-export namespace as default
export default Authorization;
