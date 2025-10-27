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
 * // Operations - standard form
 * Authorization.validate(auth);
 * const sigHash = Authorization.hash(auth);
 * const authority = Authorization.verify(auth);
 *
 * // Operations - convenience form with this:
 * Authorization.validate.call(auth);
 * const sigHash2 = Authorization.hash.call(auth);
 * const authority2 = Authorization.verify.call(auth);
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
   * Check if value is Authorization.Item (standard form)
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
   * Check if value is Authorization.Unsigned (standard form)
   *
   * @param value - Value to check
   * @returns True if value is Authorization.Unsigned
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
   * Validate authorization structure (standard form)
   *
   * @param auth - Authorization to validate
   * @throws ValidationError if invalid
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * try {
   *   Authorization.validate(auth);
   * } catch (e) {
   *   if (e instanceof Authorization.ValidationError) {
   *     console.error(e.message);
   *   }
   * }
   * ```
   */
  export function validate(auth: Item): void {
    // Chain ID must be non-zero
    if (auth.chainId === 0n) {
      throw new ValidationError("Chain ID must be non-zero");
    }

    // Address must not be zero
    if (auth.address.bytes.every((byte) => byte === 0)) {
      throw new ValidationError("Address cannot be zero address");
    }

    // yParity must be 0 or 1
    if (auth.yParity !== 0 && auth.yParity !== 1) {
      throw new ValidationError("yParity must be 0 or 1");
    }

    // r and s must be non-zero
    if (auth.r === 0n) {
      throw new ValidationError("Signature r cannot be zero");
    }
    if (auth.s === 0n) {
      throw new ValidationError("Signature s cannot be zero");
    }

    // r must be < N
    if (auth.r >= SECP256K1_N) {
      throw new ValidationError("Signature r must be less than curve order");
    }

    // s must be <= N/2 (no malleable signatures)
    if (auth.s > SECP256K1_HALF_N) {
      throw new ValidationError("Signature s too high (malleable signature)");
    }
  }

  /**
   * Validate authorization structure (convenience form with this:)
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * Authorization.validate.call(auth);
   * ```
   */
  export function isValid(this: Item): void {
    return validate(this);
  }

  // ==========================================================================
  // Hashing
  // ==========================================================================

  /**
   * Calculate signing hash for authorization (standard form)
   *
   * Hash = keccak256(MAGIC || rlp([chain_id, address, nonce]))
   *
   * @param auth - Authorization (without signature)
   * @returns Hash to sign
   *
   * @example
   * ```typescript
   * const unsigned: Authorization.Unsigned = { chainId: 1n, address, nonce: 0n };
   * const sigHash = Authorization.hash(unsigned);
   * // Now sign sigHash with private key
   * ```
   */
  export function hash(auth: Unsigned): Hash {
    // TODO: Implement keccak256(MAGIC || rlp([chain_id, address, nonce]))
    // 1. RLP encode [chainId, address.bytes, nonce]
    // 2. Prepend MAGIC_BYTE
    // 3. keccak256 hash
    throw new Error("Authorization.hash() not yet implemented");
  }

  /**
   * Calculate signing hash for authorization (convenience form with this:)
   *
   * @example
   * ```typescript
   * const unsigned: Authorization.Unsigned = { chainId: 1n, address, nonce: 0n };
   * const sigHash = Authorization.hash.call(unsigned);
   * ```
   */
  export function getHash(this: Unsigned): Hash {
    return hash(this);
  }

  // ==========================================================================
  // Creation
  // ==========================================================================

  /**
   * Create signed authorization (standard form)
   *
   * @param chainId - Chain ID
   * @param address - Target address to delegate to
   * @param nonce - Account nonce
   * @param privateKey - Private key (32 bytes) for signing
   * @returns Signed authorization
   *
   * @example
   * ```typescript
   * const auth = Authorization.create(1n, targetAddress, 0n, privateKey);
   * Authorization.validate(auth); // Should pass
   * ```
   */
  export function create(
    chainId: bigint,
    address: Address,
    nonce: bigint,
    privateKey: Uint8Array,
  ): Item {
    // TODO: Implement authorization creation with signing
    // 1. Create unsigned auth
    // 2. Hash it
    // 3. Sign hash with privateKey (secp256k1)
    // 4. Extract r, s, v from signature
    // 5. Return complete authorization
    throw new Error("Authorization.create() not yet implemented");
  }

  /**
   * Create signed authorization from unsigned (convenience form with this:)
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
    return create(this.chainId, this.address, this.nonce, privateKey);
  }

  // ==========================================================================
  // Verification
  // ==========================================================================

  /**
   * Verify authorization signature and recover authority (standard form)
   *
   * @param auth - Authorization with signature
   * @returns Recovered signer address (authority)
   * @throws ValidationError if validation fails
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const authority = Authorization.verify(auth);
   * console.log(`Authorized by: ${authority}`);
   * ```
   */
  export function verify(auth: Item): Address {
    // Validate structure first
    validate(auth);

    // TODO: Implement signature verification and recovery
    // 1. Hash unsigned portion
    // 2. Recover public key from signature (r, s, yParity) and hash
    // 3. Derive address from public key
    // 4. Return authority address
    throw new Error("Authorization.verify() not yet implemented");
  }

  /**
   * Verify authorization signature and recover authority (convenience form with this:)
   *
   * @returns Recovered signer address (authority)
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const authority = Authorization.verify.call(auth);
   * ```
   */
  export function getAuthority(this: Item): Address {
    return verify(this);
  }

  // ==========================================================================
  // Gas Calculations
  // ==========================================================================

  /**
   * Calculate gas cost for authorization list (standard form)
   *
   * @param authList - List of authorizations
   * @param emptyAccounts - Number of empty accounts being authorized
   * @returns Total gas cost
   *
   * @example
   * ```typescript
   * const authList: Authorization.Item[] = [...];
   * const gas = Authorization.calculateGasCost(authList, 2);
   * console.log(`Gas required: ${gas}`);
   * ```
   */
  export function calculateGasCost(authList: Item[], emptyAccounts: number): bigint {
    const authCost = BigInt(authList.length) * PER_AUTH_BASE_COST;
    const emptyCost = BigInt(emptyAccounts) * PER_EMPTY_ACCOUNT_COST;
    return authCost + emptyCost;
  }

  /**
   * Calculate gas cost for single authorization (standard form)
   *
   * @param isEmpty - Whether the account is empty
   * @returns Gas cost for this authorization
   */
  export function calculateSingleGasCost(isEmpty: boolean): bigint {
    return PER_AUTH_BASE_COST + (isEmpty ? PER_EMPTY_ACCOUNT_COST : 0n);
  }

  /**
   * Calculate gas cost for this authorization (convenience form with this:)
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
    return calculateSingleGasCost(isEmpty);
  }

  // ==========================================================================
  // Processing
  // ==========================================================================

  /**
   * Process authorization and return delegation designation (standard form)
   *
   * @param auth - Authorization to process
   * @returns Delegation designation with authority and delegated address
   * @throws ValidationError if authorization is invalid
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const delegation = Authorization.process(auth);
   * console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
   * ```
   */
  export function process(auth: Item): DelegationDesignation {
    // Validate and recover authority
    const authority = verify(auth);

    return {
      authority,
      delegatedAddress: auth.address,
    };
  }

  /**
   * Process this authorization (convenience form with this:)
   *
   * @returns Delegation designation
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * const delegation = Authorization.process.call(auth);
   * ```
   */
  export function getDelegation(this: Item): DelegationDesignation {
    return process(this);
  }

  /**
   * Process authorization list and return all delegations (standard form)
   *
   * @param authList - List of authorizations
   * @returns Array of delegation designations
   * @throws ValidationError if any authorization is invalid
   *
   * @example
   * ```typescript
   * const authList: Authorization.Item[] = [...];
   * const delegations = Authorization.processAll(authList);
   * delegations.forEach(d => {
   *   console.log(`${d.authority} -> ${d.delegatedAddress}`);
   * });
   * ```
   */
  export function processAll(authList: Item[]): DelegationDesignation[] {
    return authList.map((auth) => process(auth));
  }

  /**
   * Process authorization list (convenience form with this:)
   *
   * @returns Array of delegation designations
   *
   * @example
   * ```typescript
   * const authList: Authorization.Item[] = [...];
   * const delegations = Authorization.processAll.call(authList);
   * ```
   */
  export function getDelegations(this: Item[]): DelegationDesignation[] {
    return processAll(this);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Format authorization to human-readable string (standard form)
   *
   * @param auth - Authorization to format
   * @returns Human-readable string
   *
   * @example
   * ```typescript
   * const auth: Authorization.Item = {...};
   * console.log(Authorization.format(auth));
   * // "Authorization(chain=1, to=0x..., nonce=0)"
   * ```
   */
  export function format(auth: Item | Unsigned): string {
    if ("r" in auth && "s" in auth) {
      return `Authorization(chain=${auth.chainId}, to=${formatAddress(
        auth.address,
      )}, nonce=${auth.nonce}, r=0x${auth.r.toString(16)}, s=0x${auth.s.toString(
        16,
      )}, v=${auth.yParity})`;
    }
    return `Authorization(chain=${auth.chainId}, to=${formatAddress(
      auth.address,
    )}, nonce=${auth.nonce})`;
  }

  /**
   * Format this authorization (convenience form with this:)
   *
   * @returns Human-readable string
   */
  export function toString(this: Item | Unsigned): string {
    return format(this);
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
   * Check if two authorizations are equal (standard form)
   *
   * @param a - First authorization
   * @param b - Second authorization
   * @returns True if authorizations are equal
   */
  export function equals(a: Item, b: Item): boolean {
    return (
      a.chainId === b.chainId &&
      addressesEqual(a.address, b.address) &&
      a.nonce === b.nonce &&
      a.yParity === b.yParity &&
      a.r === b.r &&
      a.s === b.s
    );
  }

  /**
   * Check if this authorization equals another (convenience form with this:)
   *
   * @param other - Other authorization to compare
   * @returns True if equal
   */
  export function isEqual(this: Item, other: Item): boolean {
    return equals(this, other);
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
