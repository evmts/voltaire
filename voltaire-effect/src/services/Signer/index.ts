/**
 * @fileoverview Signer module exports for signing and transaction operations.
 *
 * @module Signer
 * @since 0.0.1
 *
 * @description
 * This module provides the signer service for signing messages,
 * transactions, and typed data. It includes the service definition,
 * layer implementation, composition helpers, and all related types.
 *
 * Main exports:
 * - {@link SignerService} - The service tag/interface
 * - {@link Signer} - Namespace with Live layer and composition helpers
 * - {@link SignerError} - Error type for failed operations
 *
 * Type exports:
 * - {@link SignerShape} - Service interface shape
 * - {@link TransactionRequest} - Transaction parameters type
 *
 * @example Typical usage with Signer.Live
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   SignerService,
 *   Signer,
 *   LocalAccount,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   return yield* signer.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n
 *   })
 * }).pipe(
 *   Effect.provide(Signer.Live),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Using Signer.fromPrivateKey
 * ```typescript
 * import { Effect } from 'effect'
 * import { SignerService, Signer, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const signerLayer = Signer.fromPrivateKey(privateKey, Provider)
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   return yield* signer.sendTransaction({ to: recipient, value: 1n })
 * }).pipe(
 *   Effect.provide(signerLayer),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link AccountService} - Required for signing operations
 * @see {@link ProviderService} - Required for gas/nonce
 * @see {@link TransportService} - Required for transaction broadcast
 */

export { Signer } from "./Signer.js";
export {
	type AddressInput,
	type CallsStatus,
	type SendCallsParams,
	SignerError,
	SignerService,
	type SignerShape,
	type TransactionRequest,
	type WalletCapabilities,
} from "./SignerService.js";

export {
	// Contract actions
	writeContract,
	type WriteContractParams,
	deployContract,
	type DeployContractParams,
	type DeployContractResult,
	// Wallet management actions
	addChain,
	type Chain,
	type NativeCurrency,
	switchChain,
	watchAsset,
	type WatchAssetParams,
	type WatchAssetOptions,
	type WatchAssetType,
	getPermissions,
	type Permission,
	type Caveat,
	requestPermissions,
	type PermissionRequest,
	getAddresses,
	// EIP-7702 Authorization actions
	prepareAuthorization,
	type PrepareAuthorizationParams,
	type Authorization,
	signAuthorization,
	type SignAuthorizationParams,
	type SignedAuthorization,
} from "./actions/index.js";
