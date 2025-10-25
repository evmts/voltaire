/**
 * Signer Interface Exports
 *
 * Comprehensive signer system for Ethereum transactions and messages.
 * Supports multiple signer types: private key, HD wallet, and hardware wallets.
 */

// Core types and interfaces
export type {
	Signer,
	SignerType,
	PrivateKeySigner,
	HDWalletSigner,
	HardwareWalletSigner,
	PrivateKeySignerOptions,
	HDWalletSignerOptions,
	HardwareWalletSignerOptions,
	Signature,
} from "./types.ts";

export {
	parseSignature,
	serializeSignature,
} from "./types.ts";

// Signer implementations
export { PrivateKeySignerImpl } from "./private-key-signer.ts";
export { HDWalletSignerImpl } from "./hd-wallet-signer.ts";
export { HardwareWalletSignerImpl } from "./hardware-signer.ts";

// Utility functions
export {
	sign,
	signMessage,
	signTypedData,
	getAddress,
	verifyMessage,
	verifyTypedData,
	recoverMessageAddress,
	recoverTypedDataAddress,
	recoverTransactionAddress,
	isCanonicalSignature,
	normalizeSignature,
} from "./utils.ts";

/**
 * Create a signer from a private key
 * @param privateKey - Private key as hex string or Uint8Array
 * @returns Private key signer instance
 *
 * @example
 * ```typescript
 * import { createPrivateKeySigner } from "@tevm/primitives";
 *
 * const signer = createPrivateKeySigner({
 *   privateKey: "0x1234..."
 * });
 *
 * const signature = await signer.signMessage("Hello!");
 * ```
 */
export { PrivateKeySignerImpl as createPrivateKeySigner } from "./private-key-signer.ts";

/**
 * Create a signer from a mnemonic phrase
 * @param options - HD wallet options
 * @returns HD wallet signer instance
 *
 * @example
 * ```typescript
 * import { createHDWalletSigner } from "@tevm/primitives";
 *
 * const signer = createHDWalletSigner({
 *   mnemonic: "test test test...",
 *   index: 0
 * });
 *
 * const address = signer.address;
 * const signature = await signer.signTransaction(tx);
 * ```
 */
export { HDWalletSignerImpl as createHDWalletSigner } from "./hd-wallet-signer.ts";

/**
 * Create a signer from a hardware wallet
 * @param options - Hardware wallet options
 * @returns Hardware wallet signer instance
 *
 * @example
 * ```typescript
 * import { createHardwareWalletSigner } from "@tevm/primitives";
 *
 * // Note: Hardware wallet support is not yet implemented
 * const signer = await createHardwareWalletSigner({
 *   deviceType: "ledger",
 *   path: "m/44'/60'/0'/0/0"
 * });
 * ```
 */
export { HardwareWalletSignerImpl as createHardwareWalletSigner } from "./hardware-signer.ts";
