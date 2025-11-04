/**
 * Transaction Types and Utilities
 *
 * Complete transaction encoding/decoding with type inference for all Ethereum transaction types.
 * All types exported at top level for intuitive access.
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
 * import * as Transaction from './transaction.js';
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

// Export types
export * from "./types.js";
export * from "./typeGuards.js";

// Export operations (internal methods with _internal suffix)
export { detectType } from "./detectType.js";
export { deserialize } from "./deserialize.js";
export { serialize as serialize_internal } from "./serialize.js";
export { hash as hash_internal } from "./hash.js";
export { getSigningHash as getSigningHash_internal } from "./getSigningHash.js";
export { getSender as getSender_internal } from "./getSender.js";
export { verifySignature as verifySignature_internal } from "./verifySignature.js";
export { format as format_internal } from "./format.js";
export { getGasPrice as getGasPrice_internal } from "./getGasPrice.js";
export { hasAccessList as hasAccessList_internal } from "./hasAccessList.js";
export { getAccessList as getAccessList_internal } from "./getAccessList.js";
export { getChainId as getChainId_internal } from "./getChainId.js";
export { assertSigned as assertSigned_internal } from "./assertSigned.js";
export { isSigned as isSigned_internal } from "./isSigned.js";

import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";
import { assertSigned as _assertSigned } from "./assertSigned.js";
import { format as _format } from "./format.js";
import { getAccessList as _getAccessList } from "./getAccessList.js";
import { getChainId as _getChainId } from "./getChainId.js";
import { getGasPrice as _getGasPrice } from "./getGasPrice.js";
import { getSender as _getSender } from "./getSender.js";
import { getSigningHash as _getSigningHash } from "./getSigningHash.js";
import { hasAccessList as _hasAccessList } from "./hasAccessList.js";
import { hash as _hash } from "./hash.js";
import { isSigned as _isSigned } from "./isSigned.js";
// Import internal methods for public wrappers
import { serialize as _serialize } from "./serialize.js";
import type { AccessList, Any } from "./types.js";
import { verifySignature as _verifySignature } from "./verifySignature.js";

// Main Transaction type (re-export Any as Transaction)
export type Transaction = Any;

// Export Legacy namespace
export * as Legacy from "./Legacy/index.js";

// Export EIP2930 namespace
export * as EIP2930 from "./EIP2930/index.js";

// Export EIP1559 namespace
export * as EIP1559 from "./EIP1559/index.js";

// Export EIP4844 namespace
export * as EIP4844 from "./EIP4844/index.js";

// Export EIP7702 namespace
export * as EIP7702 from "./EIP7702/index.js";

// Export Authorization namespace
export * as Authorization from "./Authorization/index.js";

// ============================================================================
// Public Wrapper Functions (Namespace+Type Overloading Pattern)
// ============================================================================

/**
 * Serialize transaction to RLP encoded bytes
 */
export function serialize(tx: Any): Uint8Array {
	return _serialize.call(tx);
}

/**
 * Compute transaction hash
 */
export function hash(tx: Any): Hash {
	return _hash.call(tx);
}

/**
 * Get signing hash for transaction
 */
export function getSigningHash(tx: Any): Hash {
	return _getSigningHash.call(tx);
}

/**
 * Get sender address from transaction signature
 */
export function getSender(tx: Any): Address {
	return _getSender.call(tx);
}

/**
 * Verify transaction signature
 */
export function verifySignature(tx: Any): boolean {
	return _verifySignature.call(tx);
}

/**
 * Format transaction to human-readable string
 */
export function format(tx: Any): string {
	return _format.call(tx);
}

/**
 * Get effective gas price for transaction
 */
export function getGasPrice(tx: Any, baseFee?: bigint): bigint {
	return _getGasPrice.call(tx, baseFee);
}

/**
 * Check if transaction has access list
 */
export function hasAccessList(tx: Any): boolean {
	return _hasAccessList.call(tx);
}

/**
 * Get access list (empty for legacy transactions)
 */
export function getAccessList(tx: Any): AccessList {
	return _getAccessList.call(tx);
}

/**
 * Get chain ID from transaction
 */
export function getChainId(tx: Any): bigint | null {
	return _getChainId.call(tx);
}

/**
 * Assert transaction is signed
 */
export function assertSigned(tx: Any): void {
	return _assertSigned.call(tx);
}

/**
 * Check if transaction is signed
 */
export function isSigned(tx: Any): boolean {
	return _isSigned.call(tx);
}
