/**
 * Transaction Types and Utilities
 *
 * Complete transaction encoding/decoding with type inference for all Ethereum transaction types.
 * All types exported at top level for intuitive access.
 *
 * Uses branded types throughout:
 * - `BrandedAddress` for `to` fields (20 bytes, validated at Address.from())
 * - `HashType` for hashes (32 bytes, validated at Hash.from())
 * - Transaction signature components (r, s) validated at signature creation time
 *
 * Validation strategy: Type safety at boundaries. Once you have a BrandedAddress,
 * internal utilities trust it's 20 bytes. Same for HashType (32 bytes).
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
 * import * as Address from '../Address/index.js';
 *
 * // Create branded types at boundaries
 * const to = Address.from("0x1234..."); // BrandedAddress, validated
 *
 * // Types use branded types throughout
 * const tx: Transaction.Legacy = {
 *   type: Transaction.Type.Legacy,
 *   nonce: 0n,
 *   gasPrice: 20000000000n,
 *   gasLimit: 21000n,
 *   to, // BrandedAddress - trusted to be 20 bytes
 *   value: 1000000000000000000n,
 *   data: new Uint8Array(),
 *   v: 27n,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 * };
 *
 * // Operations
 * const data = Transaction.serialize(tx);
 * const hash = Transaction.hash(tx);
 * const sender = Transaction.getSender(tx);
 * ```
 */
export { assertSigned as assertSigned_internal } from "./assertSigned.js";
export { deserialize } from "./deserialize.js";
export { detectType } from "./detectType.js";
export { format as format_internal } from "./format.js";
export { fromRpc } from "./fromRpc.js";
export { getAccessList as getAccessList_internal } from "./getAccessList.js";
export { getAuthorizationCount as getAuthorizationCount_internal } from "./getAuthorizationCount.js";
export { getAuthorizations as getAuthorizations_internal } from "./getAuthorizations.js";
export { getBlobCount as getBlobCount_internal } from "./getBlobCount.js";
export { getBlobVersionedHashes as getBlobVersionedHashes_internal } from "./getBlobVersionedHashes.js";
export { getChainId as getChainId_internal } from "./getChainId.js";
export { getGasPrice as getGasPrice_internal } from "./getGasPrice.js";
export { getRecipient as getRecipient_internal } from "./getRecipient.js";
export { getSender as getSender_internal } from "./getSender.js";
export { getSigningHash as getSigningHash_internal } from "./getSigningHash.js";
export { hasAccessList as hasAccessList_internal } from "./hasAccessList.js";
export { hash as hash_internal } from "./hash.js";
export { isContractCall as isContractCall_internal } from "./isContractCall.js";
export { isContractCreation as isContractCreation_internal } from "./isContractCreation.js";
export { isSigned as isSigned_internal } from "./isSigned.js";
export { type ReplaceOptions, replaceWith as replaceWith_internal, } from "./replaceWith.js";
export { serialize as serialize_internal } from "./serialize.js";
export { toRpc } from "./toRpc.js";
export * from "./typeGuards.js";
export * from "./types.js";
export { validateChainId as validateChainId_internal } from "./validateChainId.js";
export { validateGasLimit as validateGasLimit_internal } from "./validateGasLimit.js";
export { validateGasPrice as validateGasPrice_internal } from "./validateGasPrice.js";
export { validateNonce as validateNonce_internal } from "./validateNonce.js";
export { validateValue as validateValue_internal } from "./validateValue.js";
export { verifySignature as verifySignature_internal } from "./verifySignature.js";
export { withData as withData_internal } from "./withData.js";
export { withGasLimit as withGasLimit_internal } from "./withGasLimit.js";
export { withGasPrice as withGasPrice_internal } from "./withGasPrice.js";
export { withNonce as withNonce_internal } from "./withNonce.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import { type ReplaceOptions } from "./replaceWith.js";
import type { AccessList, Any, AuthorizationList, EIP4844, EIP7702, VersionedHash } from "./types.js";
export type Transaction = Any;
export * as Authorization from "./Authorization/index.js";
export * as EIP1559 from "./EIP1559/index.js";
export * as EIP2930 from "./EIP2930/index.js";
export * as EIP4844 from "./EIP4844/index.js";
export * as EIP7702 from "./EIP7702/index.js";
export * as Legacy from "./Legacy/index.js";
/**
 * Serialize transaction to RLP encoded bytes
 */
export declare function serialize(tx: Any): Uint8Array;
/**
 * Compute transaction hash
 */
export declare function hash(tx: Any): HashType;
/**
 * Get signing hash for transaction
 */
export declare function getSigningHash(tx: Any): HashType;
/**
 * Get sender address from transaction signature
 */
export declare function getSender(tx: Any): BrandedAddress;
/**
 * Verify transaction signature
 */
export declare function verifySignature(tx: Any): boolean;
/**
 * Format transaction to human-readable string
 */
export declare function format(tx: Any): string;
/**
 * Get effective gas price for transaction
 */
export declare function getGasPrice(tx: Any, baseFee?: bigint): bigint;
/**
 * Check if transaction has access list
 */
export declare function hasAccessList(tx: Any): boolean;
/**
 * Get access list (empty for legacy transactions)
 */
export declare function getAccessList(tx: Any): AccessList;
/**
 * Get chain ID from transaction
 */
export declare function getChainId(tx: Any): bigint | null;
/**
 * Assert transaction is signed
 */
export declare function assertSigned(tx: Any): void;
/**
 * Check if transaction is signed
 */
export declare function isSigned(tx: Any): boolean;
/**
 * Get recipient address from transaction
 */
export declare function getRecipient(tx: Any): BrandedAddress | null;
/**
 * Check if transaction is a contract creation
 */
export declare function isContractCreation(tx: Any): boolean;
/**
 * Check if transaction is a contract call
 */
export declare function isContractCall(tx: Any): boolean;
/**
 * Validate gas price is reasonable
 */
export declare function validateGasPrice(tx: Any): void;
/**
 * Validate gas limit is valid
 */
export declare function validateGasLimit(tx: Any): void;
/**
 * Validate nonce format
 */
export declare function validateNonce(tx: Any): void;
/**
 * Validate value is valid
 */
export declare function validateValue(tx: Any): void;
/**
 * Validate chain ID is present
 */
export declare function validateChainId(tx: Any): void;
/**
 * Return new transaction with updated nonce
 */
export declare function withNonce(tx: Any, nonce: bigint): Any;
/**
 * Return new transaction with updated gas limit
 */
export declare function withGasLimit(tx: Any, gasLimit: bigint): Any;
/**
 * Return new transaction with updated gas price
 */
export declare function withGasPrice(tx: Any, gasPrice: bigint): Any;
/**
 * Return new transaction with updated data
 */
export declare function withData(tx: Any, data: Uint8Array): Any;
/**
 * Return new transaction with fee bump for replacement
 */
export declare function replaceWith(tx: Any, options?: ReplaceOptions): Any;
/**
 * Get blob count for EIP-4844 transaction
 */
export declare function getBlobCount(tx: EIP4844): number;
/**
 * Get blob versioned hashes for EIP-4844 transaction
 */
export declare function getBlobVersionedHashes(tx: EIP4844): readonly VersionedHash[];
/**
 * Get authorization count for EIP-7702 transaction
 */
export declare function getAuthorizationCount(tx: EIP7702): number;
/**
 * Get authorization list for EIP-7702 transaction
 */
export declare function getAuthorizations(tx: EIP7702): AuthorizationList;
//# sourceMappingURL=Transaction.d.ts.map