/**
 * Transaction Types and Utilities
 *
 * Complete transaction encoding/decoding with type inference for all Ethereum transaction types.
 * All types namespaced under Transaction for intuitive access.
 *
 * Supports:
 * - Legacy (Type 0): Original format with fixed gas price
 * - EIP-2930 (Type 1): Access lists and explicit chain ID
 * - EIP-1559 (Type 2): Dynamic fee market
 * - EIP-4844 (Type 3): Blob transactions for L2 scaling
 * - EIP-7702 (Type 4): EOA delegation to smart contracts
 *
 * @example
 * ```typescript
 * import { Transaction } from './transaction.js';
 *
 * // Types
 * const legacy: Transaction.Legacy = { ... };
 * const eip1559: Transaction.EIP1559 = { ... };
 *
 * // Operations
 * const data = Transaction.serialize(tx);
 * const hash = Transaction.hash(tx);
 * const decoded = Transaction.deserialize(data);
 *
 * // Type-specific operations with this: pattern
 * const hash = Transaction.Legacy.hash.call(legacy);
 * const serialized = Transaction.EIP1559.serialize.call(eip1559);
 * ```
 */

import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// ============================================================================
// Main Transaction Namespace
// ============================================================================

export namespace Transaction {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Transaction type discriminator
   */
  export enum Type {
    Legacy = 0x00,
    EIP2930 = 0x01,
    EIP1559 = 0x02,
    EIP4844 = 0x03,
    EIP7702 = 0x04,
  }

  /**
   * Access list item for EIP-2930 and later transactions
   */
  export type AccessListItem = {
    address: Address;
    storageKeys: readonly Hash[];
  };

  /**
   * Access list (array of items)
   */
  export type AccessList = readonly AccessListItem[];

  /**
   * Authorization for EIP-7702 transactions
   */
  export type Authorization = {
    chainId: bigint;
    address: Address;
    nonce: bigint;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
  };

  /**
   * Authorization list (array of authorizations)
   */
  export type AuthorizationList = readonly Authorization[];

  /**
   * Versioned hash for EIP-4844 blob transactions
   */
  export type VersionedHash = Hash;

  /**
   * Signature components (ECDSA secp256k1)
   */
  export type Signature = {
    r: Uint8Array;
    s: Uint8Array;
  };

  // ==========================================================================
  // Legacy Transaction (Type 0)
  // ==========================================================================

  /**
   * Legacy transaction (Type 0)
   * Original Ethereum transaction format with fixed gas price
   */
  export type Legacy = {
    type: Type.Legacy;
    nonce: bigint;
    gasPrice: bigint;
    gasLimit: bigint;
    to: Address | null;
    value: bigint;
    data: Uint8Array;
    v: bigint;
    r: Uint8Array;
    s: Uint8Array;
  };

  export namespace Legacy {
    /**
     * Serialize legacy transaction to RLP encoded bytes
     */
    export function serialize(this: Transaction.Legacy): Uint8Array {
      // TODO: RLP encode [nonce, gasPrice, gasLimit, to, value, data, v, r, s]
      throw new Error("Not implemented");
    }

    /**
     * Compute transaction hash (keccak256 of serialized transaction)
     */
    export function hash(this: Transaction.Legacy): Hash {
      // TODO: keccak256(serialize.call(this))
      throw new Error("Not implemented");
    }

    /**
     * Get signing hash (hash of unsigned transaction for signature generation)
     */
    export function getSigningHash(this: Transaction.Legacy): Hash {
      // TODO: RLP encode unsigned tx, then keccak256
      // For EIP-155: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
      // Pre-EIP-155: [nonce, gasPrice, gasLimit, to, value, data]
      throw new Error("Not implemented");
    }

    /**
     * Deserialize RLP encoded legacy transaction
     */
    export function deserialize(data: Uint8Array): Transaction.Legacy {
      // TODO: RLP decode to extract fields
      throw new Error("Not implemented");
    }

    /**
     * Extract chain ID from v value (EIP-155)
     */
    export function getChainId(this: Transaction.Legacy): bigint | null {
      // EIP-155: chainId = (v - 35) / 2 (if v >= 35)
      // Pre-EIP-155: null
      if (this.v < 35n) return null;
      return (this.v - 35n) / 2n;
    }

    /**
     * Get sender address from signature
     */
    export function getSender(this: Transaction.Legacy): Address {
      // TODO:
      // 1. Get signing hash
      // 2. Recover public key from signature (r, s, v)
      // 3. Derive address from public key
      throw new Error("Not implemented");
    }

    /**
     * Verify transaction signature
     */
    export function verifySignature(this: Transaction.Legacy): boolean {
      // TODO:
      // 1. Get signing hash
      // 2. Verify ECDSA signature
      // 3. Check r, s in valid range
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // EIP-2930 Transaction (Type 1)
  // ==========================================================================

  /**
   * EIP-2930 transaction (Type 1)
   * Adds access list and explicit chain ID for replay protection
   */
  export type EIP2930 = {
    type: Type.EIP2930;
    chainId: bigint;
    nonce: bigint;
    gasPrice: bigint;
    gasLimit: bigint;
    to: Address | null;
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
  };

  export namespace EIP2930 {
    /**
     * Serialize EIP-2930 transaction to RLP encoded bytes
     */
    export function serialize(this: Transaction.EIP2930): Uint8Array {
      // TODO: 0x01 || RLP([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, yParity, r, s])
      throw new Error("Not implemented");
    }

    /**
     * Compute transaction hash
     */
    export function hash(this: Transaction.EIP2930): Hash {
      // TODO: keccak256(serialize.call(this))
      throw new Error("Not implemented");
    }

    /**
     * Get signing hash
     */
    export function getSigningHash(this: Transaction.EIP2930): Hash {
      // TODO: keccak256(0x01 || RLP([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList]))
      throw new Error("Not implemented");
    }

    /**
     * Deserialize RLP encoded EIP-2930 transaction
     */
    export function deserialize(data: Uint8Array): Transaction.EIP2930 {
      // TODO: Check type byte, RLP decode rest
      throw new Error("Not implemented");
    }

    /**
     * Get sender address from signature
     */
    export function getSender(this: Transaction.EIP2930): Address {
      // TODO: Recover from signature using signing hash
      throw new Error("Not implemented");
    }

    /**
     * Verify transaction signature
     */
    export function verifySignature(this: Transaction.EIP2930): boolean {
      // TODO: Verify ECDSA signature
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // EIP-1559 Transaction (Type 2)
  // ==========================================================================

  /**
   * EIP-1559 transaction (Type 2)
   * Dynamic fee market with priority fee and max fee per gas
   */
  export type EIP1559 = {
    type: Type.EIP1559;
    chainId: bigint;
    nonce: bigint;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: bigint;
    to: Address | null;
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
  };

  export namespace EIP1559 {
    /**
     * Serialize EIP-1559 transaction to RLP encoded bytes
     */
    export function serialize(this: Transaction.EIP1559): Uint8Array {
      // TODO: 0x02 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, yParity, r, s])
      throw new Error("Not implemented");
    }

    /**
     * Compute transaction hash
     */
    export function hash(this: Transaction.EIP1559): Hash {
      // TODO: keccak256(serialize.call(this))
      throw new Error("Not implemented");
    }

    /**
     * Get signing hash
     */
    export function getSigningHash(this: Transaction.EIP1559): Hash {
      // TODO: keccak256(0x02 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList]))
      throw new Error("Not implemented");
    }

    /**
     * Deserialize RLP encoded EIP-1559 transaction
     */
    export function deserialize(data: Uint8Array): Transaction.EIP1559 {
      // TODO: Check type byte, RLP decode rest
      throw new Error("Not implemented");
    }

    /**
     * Get sender address from signature
     */
    export function getSender(this: Transaction.EIP1559): Address {
      // TODO: Recover from signature using signing hash
      throw new Error("Not implemented");
    }

    /**
     * Verify transaction signature
     */
    export function verifySignature(this: Transaction.EIP1559): boolean {
      // TODO: Verify ECDSA signature
      throw new Error("Not implemented");
    }

    /**
     * Calculate effective gas price given base fee
     */
    export function getEffectiveGasPrice(
      this: Transaction.EIP1559,
      baseFee: bigint,
    ): bigint {
      const maxPriorityFee = this.maxPriorityFeePerGas;
      const maxFee = this.maxFeePerGas;
      const effectivePriorityFee = maxFee - baseFee < maxPriorityFee
        ? maxFee - baseFee
        : maxPriorityFee;
      return baseFee + effectivePriorityFee;
    }
  }

  // ==========================================================================
  // EIP-4844 Transaction (Type 3)
  // ==========================================================================

  /**
   * EIP-4844 blob transaction (Type 3)
   * Adds blob data support for layer 2 scaling with separate blob gas market
   */
  export type EIP4844 = {
    type: Type.EIP4844;
    chainId: bigint;
    nonce: bigint;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: bigint;
    to: Address; // Note: Cannot be null for blob transactions
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    maxFeePerBlobGas: bigint;
    blobVersionedHashes: readonly VersionedHash[];
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
  };

  export namespace EIP4844 {
    /**
     * Serialize EIP-4844 transaction to RLP encoded bytes
     */
    export function serialize(this: Transaction.EIP4844): Uint8Array {
      // TODO: 0x03 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, maxFeePerBlobGas, blobVersionedHashes, yParity, r, s])
      throw new Error("Not implemented");
    }

    /**
     * Compute transaction hash
     */
    export function hash(this: Transaction.EIP4844): Hash {
      // TODO: keccak256(serialize.call(this))
      throw new Error("Not implemented");
    }

    /**
     * Get signing hash
     */
    export function getSigningHash(this: Transaction.EIP4844): Hash {
      // TODO: keccak256(0x03 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, maxFeePerBlobGas, blobVersionedHashes]))
      throw new Error("Not implemented");
    }

    /**
     * Deserialize RLP encoded EIP-4844 transaction
     */
    export function deserialize(data: Uint8Array): Transaction.EIP4844 {
      // TODO: Check type byte, RLP decode rest
      throw new Error("Not implemented");
    }

    /**
     * Get sender address from signature
     */
    export function getSender(this: Transaction.EIP4844): Address {
      // TODO: Recover from signature using signing hash
      throw new Error("Not implemented");
    }

    /**
     * Verify transaction signature
     */
    export function verifySignature(this: Transaction.EIP4844): boolean {
      // TODO: Verify ECDSA signature
      throw new Error("Not implemented");
    }

    /**
     * Calculate effective gas price given base fee
     */
    export function getEffectiveGasPrice(
      this: Transaction.EIP4844,
      baseFee: bigint,
    ): bigint {
      const maxPriorityFee = this.maxPriorityFeePerGas;
      const maxFee = this.maxFeePerGas;
      const effectivePriorityFee = maxFee - baseFee < maxPriorityFee
        ? maxFee - baseFee
        : maxPriorityFee;
      return baseFee + effectivePriorityFee;
    }

    /**
     * Calculate total blob gas cost
     */
    export function getBlobGasCost(
      this: Transaction.EIP4844,
      blobBaseFee: bigint,
    ): bigint {
      // Each blob is 128 KB = 131072 bytes, gas per blob is fixed
      const gasPerBlob = 131072n;
      const blobCount = BigInt(this.blobVersionedHashes.length);
      return blobCount * gasPerBlob * blobBaseFee;
    }
  }

  // ==========================================================================
  // EIP-7702 Transaction (Type 4)
  // ==========================================================================

  /**
   * EIP-7702 transaction (Type 4)
   * EOA delegation to smart contracts with authorization list
   */
  export type EIP7702 = {
    type: Type.EIP7702;
    chainId: bigint;
    nonce: bigint;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: bigint;
    to: Address | null;
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    authorizationList: AuthorizationList;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
  };

  export namespace EIP7702 {
    /**
     * Serialize EIP-7702 transaction to RLP encoded bytes
     */
    export function serialize(this: Transaction.EIP7702): Uint8Array {
      // TODO: 0x04 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, authorizationList, yParity, r, s])
      throw new Error("Not implemented");
    }

    /**
     * Compute transaction hash
     */
    export function hash(this: Transaction.EIP7702): Hash {
      // TODO: keccak256(serialize.call(this))
      throw new Error("Not implemented");
    }

    /**
     * Get signing hash
     */
    export function getSigningHash(this: Transaction.EIP7702): Hash {
      // TODO: keccak256(0x04 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, authorizationList]))
      throw new Error("Not implemented");
    }

    /**
     * Deserialize RLP encoded EIP-7702 transaction
     */
    export function deserialize(data: Uint8Array): Transaction.EIP7702 {
      // TODO: Check type byte, RLP decode rest
      throw new Error("Not implemented");
    }

    /**
     * Get sender address from signature
     */
    export function getSender(this: Transaction.EIP7702): Address {
      // TODO: Recover from signature using signing hash
      throw new Error("Not implemented");
    }

    /**
     * Verify transaction signature
     */
    export function verifySignature(this: Transaction.EIP7702): boolean {
      // TODO: Verify ECDSA signature
      throw new Error("Not implemented");
    }

    /**
     * Calculate effective gas price given base fee
     */
    export function getEffectiveGasPrice(
      this: Transaction.EIP7702,
      baseFee: bigint,
    ): bigint {
      const maxPriorityFee = this.maxPriorityFeePerGas;
      const maxFee = this.maxFeePerGas;
      const effectivePriorityFee = maxFee - baseFee < maxPriorityFee
        ? maxFee - baseFee
        : maxPriorityFee;
      return baseFee + effectivePriorityFee;
    }
  }

  // ==========================================================================
  // Authorization Operations
  // ==========================================================================

  export namespace Authorization {
    /**
     * Get signing hash for authorization
     */
    export function getSigningHash(this: Transaction.Authorization): Hash {
      // TODO: keccak256(authorization data per EIP-7702)
      throw new Error("Not implemented");
    }

    /**
     * Verify authorization signature
     */
    export function verifySignature(this: Transaction.Authorization): boolean {
      // TODO: Verify ECDSA signature on authorization
      throw new Error("Not implemented");
    }

    /**
     * Get authorizing address from signature
     */
    export function getAuthorizer(this: Transaction.Authorization): Address {
      // TODO: Recover address from authorization signature
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // Union Type and Type Guards
  // ==========================================================================

  /**
   * Any transaction type
   */
  export type Any = Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702;

  /**
   * Type guard: Check if transaction is Legacy
   */
  export function isLegacy(tx: Any): tx is Legacy {
    return tx.type === Type.Legacy;
  }

  /**
   * Type guard: Check if transaction is EIP-2930
   */
  export function isEIP2930(tx: Any): tx is EIP2930 {
    return tx.type === Type.EIP2930;
  }

  /**
   * Type guard: Check if transaction is EIP-1559
   */
  export function isEIP1559(tx: Any): tx is EIP1559 {
    return tx.type === Type.EIP1559;
  }

  /**
   * Type guard: Check if transaction is EIP-4844
   */
  export function isEIP4844(tx: Any): tx is EIP4844 {
    return tx.type === Type.EIP4844;
  }

  /**
   * Type guard: Check if transaction is EIP-7702
   */
  export function isEIP7702(tx: Any): tx is EIP7702 {
    return tx.type === Type.EIP7702;
  }

  // ==========================================================================
  // Transaction-Level Operations (operate on any transaction type)
  // ==========================================================================

  /**
   * Detect transaction type from encoded data (standard form)
   *
   * @param data - RLP encoded transaction data
   * @returns Transaction type
   *
   * @example
   * ```typescript
   * const type = Transaction.detectType(txData);
   * if (type === Transaction.Type.EIP1559) { ... }
   * ```
   */
  export function detectType(data: Uint8Array): Type {
    if (data.length === 0) {
      throw new Error("Empty transaction data");
    }

    // Typed transactions start with a byte < 0xc0 (RLP list marker)
    const firstByte = data[0];
    if (firstByte < 0xc0) {
      // EIP-2718 typed transaction
      if (firstByte === Type.Legacy) return Type.Legacy;
      if (firstByte === Type.EIP2930) return Type.EIP2930;
      if (firstByte === Type.EIP1559) return Type.EIP1559;
      if (firstByte === Type.EIP4844) return Type.EIP4844;
      if (firstByte === Type.EIP7702) return Type.EIP7702;
      throw new Error(`Unknown transaction type: 0x${firstByte.toString(16)}`);
    }

    // Legacy RLP encoded transaction
    return Type.Legacy;
  }

  /**
   * Serialize transaction to RLP encoded bytes (standard form)
   *
   * @param tx - Transaction of any type
   * @returns RLP encoded transaction
   *
   * @example
   * ```typescript
   * const serialized = Transaction.serialize(tx);
   * ```
   */
  export function serialize(tx: Any): Uint8Array {
    switch (tx.type) {
      case Type.Legacy:
        return Legacy.serialize.call(tx);
      case Type.EIP2930:
        return EIP2930.serialize.call(tx);
      case Type.EIP1559:
        return EIP1559.serialize.call(tx);
      case Type.EIP4844:
        return EIP4844.serialize.call(tx);
      case Type.EIP7702:
        return EIP7702.serialize.call(tx);
      default:
        throw new Error(`Unknown transaction type: ${(tx as any).type}`);
    }
  }

  /**
   * Compute transaction hash (standard form)
   *
   * @param tx - Transaction of any type
   * @returns 32-byte transaction hash
   *
   * @example
   * ```typescript
   * const txHash = Transaction.hash(tx);
   * ```
   */
  export function hash(tx: Any): Hash {
    switch (tx.type) {
      case Type.Legacy:
        return Legacy.hash.call(tx);
      case Type.EIP2930:
        return EIP2930.hash.call(tx);
      case Type.EIP1559:
        return EIP1559.hash.call(tx);
      case Type.EIP4844:
        return EIP4844.hash.call(tx);
      case Type.EIP7702:
        return EIP7702.hash.call(tx);
      default:
        throw new Error(`Unknown transaction type: ${(tx as any).type}`);
    }
  }

  /**
   * Get signing hash for transaction (standard form)
   *
   * @param tx - Transaction of any type
   * @returns Hash that should be signed
   *
   * @example
   * ```typescript
   * const signingHash = Transaction.getSigningHash(tx);
   * ```
   */
  export function getSigningHash(tx: Any): Hash {
    switch (tx.type) {
      case Type.Legacy:
        return Legacy.getSigningHash.call(tx);
      case Type.EIP2930:
        return EIP2930.getSigningHash.call(tx);
      case Type.EIP1559:
        return EIP1559.getSigningHash.call(tx);
      case Type.EIP4844:
        return EIP4844.getSigningHash.call(tx);
      case Type.EIP7702:
        return EIP7702.getSigningHash.call(tx);
      default:
        throw new Error(`Unknown transaction type: ${(tx as any).type}`);
    }
  }

  /**
   * Deserialize RLP encoded transaction (standard form)
   *
   * @param data - RLP encoded transaction data
   * @returns Decoded transaction
   *
   * @example
   * ```typescript
   * const tx = Transaction.deserialize(encodedData);
   * if (Transaction.isEIP1559(tx)) {
   *   console.log(tx.maxFeePerGas);
   * }
   * ```
   */
  export function deserialize(data: Uint8Array): Any {
    const type = detectType(data);
    switch (type) {
      case Type.Legacy:
        return Legacy.deserialize(data);
      case Type.EIP2930:
        return EIP2930.deserialize(data);
      case Type.EIP1559:
        return EIP1559.deserialize(data);
      case Type.EIP4844:
        return EIP4844.deserialize(data);
      case Type.EIP7702:
        return EIP7702.deserialize(data);
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Get sender address from transaction signature (standard form)
   *
   * @param tx - Transaction of any type
   * @returns Sender address
   *
   * @example
   * ```typescript
   * const sender = Transaction.getSender(tx);
   * ```
   */
  export function getSender(tx: Any): Address {
    switch (tx.type) {
      case Type.Legacy:
        return Legacy.getSender.call(tx);
      case Type.EIP2930:
        return EIP2930.getSender.call(tx);
      case Type.EIP1559:
        return EIP1559.getSender.call(tx);
      case Type.EIP4844:
        return EIP4844.getSender.call(tx);
      case Type.EIP7702:
        return EIP7702.getSender.call(tx);
      default:
        throw new Error(`Unknown transaction type: ${(tx as any).type}`);
    }
  }

  /**
   * Verify transaction signature (standard form)
   *
   * @param tx - Transaction of any type
   * @returns True if signature is valid
   *
   * @example
   * ```typescript
   * if (Transaction.verifySignature(tx)) {
   *   console.log('Valid signature');
   * }
   * ```
   */
  export function verifySignature(tx: Any): boolean {
    switch (tx.type) {
      case Type.Legacy:
        return Legacy.verifySignature.call(tx);
      case Type.EIP2930:
        return EIP2930.verifySignature.call(tx);
      case Type.EIP1559:
        return EIP1559.verifySignature.call(tx);
      case Type.EIP4844:
        return EIP4844.verifySignature.call(tx);
      case Type.EIP7702:
        return EIP7702.verifySignature.call(tx);
      default:
        throw new Error(`Unknown transaction type: ${(tx as any).type}`);
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Format transaction to human-readable string
   *
   * @example "EIP-1559 tx from 0x742d...f251e to 0x1234...5678, value: 1.5 ETH"
   */
  export function format(tx: Any): string {
    const typeNames = {
      [Type.Legacy]: "Legacy",
      [Type.EIP2930]: "EIP-2930",
      [Type.EIP1559]: "EIP-1559",
      [Type.EIP4844]: "EIP-4844",
      [Type.EIP7702]: "EIP-7702",
    };

    const typeName = typeNames[tx.type];
    const toStr = tx.to ? `to ${tx.to}` : "contract creation";
    const valueEth = Number(tx.value) / 1e18;

    return `${typeName} tx ${toStr}, value: ${valueEth} ETH, nonce: ${tx.nonce}`;
  }

  /**
   * Get transaction gas price (handles different types)
   */
  export function getGasPrice(tx: Any, baseFee?: bigint): bigint {
    if (isLegacy(tx) || isEIP2930(tx)) {
      return tx.gasPrice;
    }

    if (!baseFee) {
      throw new Error("baseFee required for EIP-1559+ transactions");
    }

    if (isEIP1559(tx)) {
      return EIP1559.getEffectiveGasPrice.call(tx, baseFee);
    }

    if (isEIP4844(tx)) {
      return EIP4844.getEffectiveGasPrice.call(tx, baseFee);
    }

    if (isEIP7702(tx)) {
      return EIP7702.getEffectiveGasPrice.call(tx, baseFee);
    }

    throw new Error(`Unknown transaction type: ${(tx as any).type}`);
  }

  /**
   * Check if transaction has access list
   */
  export function hasAccessList(tx: Any): boolean {
    return !isLegacy(tx);
  }

  /**
   * Get access list (empty for legacy transactions)
   */
  export function getAccessList(tx: Any): AccessList {
    if (isLegacy(tx)) {
      return [];
    }
    return tx.accessList;
  }

  /**
   * Get chain ID (null for pre-EIP-155 legacy transactions)
   */
  export function getChainId(tx: Any): bigint | null {
    if (isLegacy(tx)) {
      return Legacy.getChainId.call(tx);
    }
    return tx.chainId;
  }

  /**
   * Assert transaction is signed (has non-zero signature)
   */
  export function assertSigned(tx: Any): void {
    const isZeroR = tx.r.every((b) => b === 0);
    const isZeroS = tx.s.every((b) => b === 0);

    if (isZeroR || isZeroS) {
      throw new Error("Transaction is not signed");
    }
  }

  /**
   * Check if transaction is signed
   */
  export function isSigned(tx: Any): boolean {
    try {
      assertSigned(tx);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Complete Transaction type (same as Transaction.Any)
 *
 * Uses TypeScript declaration merging - Transaction is both a namespace and a type.
 */
export type Transaction = Transaction.Any;

// Re-export namespace as default
export default Transaction;
