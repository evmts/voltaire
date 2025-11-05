/**
 * Authorization type definitions
 *
 * This file contains type definitions for EIP-7702 authorizations.
 * Runtime type definitions are in BrandedAuthorization.ts
 */

/**
 * Authorization without signature (for hashing)
 *
 * @typedef {Object} Unsigned
 * @property {bigint} chainId - Chain ID where authorization is valid
 * @property {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} address - Address to delegate code execution to
 * @property {bigint} nonce - Nonce of the authorizing account
 */

/**
 * Delegation designation result
 *
 * @typedef {Object} DelegationDesignation
 * @property {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} authority - Authority (signer) address
 * @property {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} delegatedAddress - Delegated code address
 */
