/**
 * Viem-compatible Account Abstraction for Voltaire
 *
 * Drop-in replacement for viem's account module using Voltaire primitives.
 *
 * @module viem-account
 *
 * @example
 * ```typescript
 * import { privateKeyToAccount } from './examples/viem-account/index.js';
 *
 * const account = privateKeyToAccount(
 *   '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
 * );
 *
 * // Sign messages
 * const sig = await account.signMessage({ message: 'Hello!' });
 *
 * // Sign typed data
 * const typedSig = await account.signTypedData({
 *   domain: { name: 'App' },
 *   types: { Message: [{ name: 'content', type: 'string' }] },
 *   primaryType: 'Message',
 *   message: { content: 'Hello!' },
 * });
 *
 * // Sign transactions
 * const txSig = await account.signTransaction({
 *   to: '0x...',
 *   value: 1000000000000000000n,
 * });
 * ```
 */

// Export main factory function
export { privateKeyToAccount, PrivateKeyToAccount } from "./privateKeyToAccount.js";

// Export signing utilities
export { signMessage, hashMessage, SignMessage } from "./signMessage.js";
export { signTypedData, SignTypedData } from "./signTypedData.js";
export { signTransaction, SignTransaction } from "./signTransaction.js";

// Export types
export type {
	Hex,
	SignableMessage,
	EIP712Domain,
	TypeProperty,
	TypedDataDefinition,
	SignatureComponents,
	AuthorizationRequest,
	SignedAuthorization,
	SerializeTransactionFn,
	NonceManager,
	CustomSource,
	JsonRpcAccount,
	LocalAccount,
	PrivateKeyAccount,
	HDKey,
	HDOptions,
	HDAccount,
	Account,
	PrivateKeyToAccountOptions,
} from "./AccountTypes.js";

// Export errors
export {
	AccountError,
	InvalidAddressError,
	InvalidPrivateKeyError,
	SigningError,
	InvalidMessageError,
	InvalidTypedDataError,
} from "./errors.js";
