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
export { getRecipient as getRecipient_internal } from "./getRecipient.js";
export { isContractCreation as isContractCreation_internal } from "./isContractCreation.js";
export { isContractCall as isContractCall_internal } from "./isContractCall.js";
export { validateGasPrice as validateGasPrice_internal } from "./validateGasPrice.js";
export { validateGasLimit as validateGasLimit_internal } from "./validateGasLimit.js";
export { validateNonce as validateNonce_internal } from "./validateNonce.js";
export { validateValue as validateValue_internal } from "./validateValue.js";
export { validateChainId as validateChainId_internal } from "./validateChainId.js";
export { withNonce as withNonce_internal } from "./withNonce.js";
export { withGasLimit as withGasLimit_internal } from "./withGasLimit.js";
export { withGasPrice as withGasPrice_internal } from "./withGasPrice.js";
export { withData as withData_internal } from "./withData.js";
export {
	replaceWith as replaceWith_internal,
	type ReplaceOptions,
} from "./replaceWith.js";
export { getBlobCount as getBlobCount_internal } from "./getBlobCount.js";
export { getBlobVersionedHashes as getBlobVersionedHashes_internal } from "./getBlobVersionedHashes.js";
export { getAuthorizationCount as getAuthorizationCount_internal } from "./getAuthorizationCount.js";
export { getAuthorizations as getAuthorizations_internal } from "./getAuthorizations.js";

import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/index.js";
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
import type {
	AccessList,
	Any,
	AuthorizationList,
	EIP4844,
	EIP7702,
	VersionedHash,
} from "./types.js";
import { verifySignature as _verifySignature } from "./verifySignature.js";
import { getRecipient as _getRecipient } from "./getRecipient.js";
import { isContractCreation as _isContractCreation } from "./isContractCreation.js";
import { isContractCall as _isContractCall } from "./isContractCall.js";
import { validateGasPrice as _validateGasPrice } from "./validateGasPrice.js";
import { validateGasLimit as _validateGasLimit } from "./validateGasLimit.js";
import { validateNonce as _validateNonce } from "./validateNonce.js";
import { validateValue as _validateValue } from "./validateValue.js";
import { validateChainId as _validateChainId } from "./validateChainId.js";
import { withNonce as _withNonce } from "./withNonce.js";
import { withGasLimit as _withGasLimit } from "./withGasLimit.js";
import { withGasPrice as _withGasPrice } from "./withGasPrice.js";
import { withData as _withData } from "./withData.js";
import {
	replaceWith as _replaceWith,
	type ReplaceOptions,
} from "./replaceWith.js";
import { getBlobCount as _getBlobCount } from "./getBlobCount.js";
import { getBlobVersionedHashes as _getBlobVersionedHashes } from "./getBlobVersionedHashes.js";
import { getAuthorizationCount as _getAuthorizationCount } from "./getAuthorizationCount.js";
import { getAuthorizations as _getAuthorizations } from "./getAuthorizations.js";

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
export function hash(tx: Any): BrandedHash {
	return _hash.call(tx);
}

/**
 * Get signing hash for transaction
 */
export function getSigningHash(tx: Any): BrandedHash {
	return _getSigningHash.call(tx);
}

/**
 * Get sender address from transaction signature
 */
export function getSender(tx: Any): BrandedAddress {
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

/**
 * Get recipient address from transaction
 */
export function getRecipient(tx: Any): BrandedAddress | null {
	return _getRecipient.call(tx);
}

/**
 * Check if transaction is a contract creation
 */
export function isContractCreation(tx: Any): boolean {
	return _isContractCreation.call(tx);
}

/**
 * Check if transaction is a contract call
 */
export function isContractCall(tx: Any): boolean {
	return _isContractCall.call(tx);
}

/**
 * Validate gas price is reasonable
 */
export function validateGasPrice(tx: Any): void {
	return _validateGasPrice.call(tx);
}

/**
 * Validate gas limit is valid
 */
export function validateGasLimit(tx: Any): void {
	return _validateGasLimit.call(tx);
}

/**
 * Validate nonce format
 */
export function validateNonce(tx: Any): void {
	return _validateNonce.call(tx);
}

/**
 * Validate value is valid
 */
export function validateValue(tx: Any): void {
	return _validateValue.call(tx);
}

/**
 * Validate chain ID is present
 */
export function validateChainId(tx: Any): void {
	if ("chainId" in tx) {
		return _validateChainId.call(tx);
	}
}

/**
 * Return new transaction with updated nonce
 */
export function withNonce(tx: Any, nonce: bigint): Any {
	return _withNonce.call(tx, nonce);
}

/**
 * Return new transaction with updated gas limit
 */
export function withGasLimit(tx: Any, gasLimit: bigint): Any {
	return _withGasLimit.call(tx, gasLimit);
}

/**
 * Return new transaction with updated gas price
 */
export function withGasPrice(tx: Any, gasPrice: bigint): Any {
	return _withGasPrice.call(tx, gasPrice);
}

/**
 * Return new transaction with updated data
 */
export function withData(tx: Any, data: Uint8Array): Any {
	return _withData.call(tx, data);
}

/**
 * Return new transaction with fee bump for replacement
 */
export function replaceWith(tx: Any, options?: ReplaceOptions): Any {
	return _replaceWith.call(tx, options);
}

/**
 * Get blob count for EIP-4844 transaction
 */
export function getBlobCount(tx: EIP4844): number {
	return _getBlobCount.call(tx);
}

/**
 * Get blob versioned hashes for EIP-4844 transaction
 */
export function getBlobVersionedHashes(tx: EIP4844): readonly VersionedHash[] {
	return _getBlobVersionedHashes.call(tx);
}

/**
 * Get authorization count for EIP-7702 transaction
 */
export function getAuthorizationCount(tx: EIP7702): number {
	return _getAuthorizationCount.call(tx);
}

/**
 * Get authorization list for EIP-7702 transaction
 */
export function getAuthorizations(tx: EIP7702): AuthorizationList {
	return _getAuthorizations.call(tx);
}
