/**
 * NonceManager - Transaction nonce management for Ethereum
 *
 * Prevents nonce gaps and race conditions when sending concurrent transactions.
 *
 * @example
 * ```ts
 * import { createNonceManager, jsonRpc } from '@voltaire/nonce-manager';
 *
 * const manager = createNonceManager({ source: jsonRpc() });
 *
 * // Send 3 transactions concurrently
 * const [nonce1, nonce2, nonce3] = await Promise.all([
 *   manager.consume({ address, chainId, provider }),
 *   manager.consume({ address, chainId, provider }),
 *   manager.consume({ address, chainId, provider }),
 * ]);
 * // nonces are sequential: 5, 6, 7
 * ```
 *
 * @module nonce-manager
 */

// Types
export type {
	AddressInput,
	NonceParameters,
	NonceParametersWithProvider,
	NonceSource,
	CreateNonceManagerOptions,
	NonceManager,
	PendingTransaction,
	NonceManagerWithTracking,
	ManagedSigner,
	WrapSignerOptions,
} from "./NonceManagerType.js";

// Errors
export {
	NonceError,
	NonceTooLowError,
	NonceGapError,
	NonceSyncError,
	NonceStateError,
	NonceRecycleError,
	NonceProviderError,
} from "./errors.js";

// Core implementation
export {
	createNonceManager,
	nonceManager,
	jsonRpc,
	inMemory,
	wrapSigner,
} from "./NonceManager.js";
