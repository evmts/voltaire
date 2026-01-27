/**
 * @fileoverview HD Wallet mnemonic account implementation.
 *
 * @module fromMnemonic
 * @since 0.0.1
 *
 * @description
 * Provides a mnemonic-based account implementation that derives a private key
 * from a BIP-39 mnemonic phrase using BIP-32/BIP-44 derivation paths.
 *
 * IMPORTANT: HDWallet requires native FFI and only works in native
 * environments (Node.js/Bun with FFI support). WASM bundle not supported.
 *
 * @see {@link LocalAccount} - The underlying account implementation
 * @see {@link AccountService} - The service interface
 */

import { type BrandedHex, Hex } from "@tevm/voltaire";
import * as Bip39 from "@tevm/voltaire/Bip39";
import { HDWallet } from "@tevm/voltaire/native";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	KeccakService,
	type KeccakServiceShape,
} from "../../crypto/Keccak256/index.js";
import {
	Secp256k1Service,
	type Secp256k1ServiceShape,
} from "../../crypto/Secp256k1/index.js";
import { AccountService } from "./AccountService.js";
import { createLocalAccount } from "./LocalAccount.js";

type HexType = BrandedHex.HexType;
type HDWalletApi = typeof HDWallet;
type ExtendedKeyType = ReturnType<HDWalletApi["fromSeed"]>;

export interface MnemonicAccountOptions {
	readonly account?: number;
	readonly index?: number;
	readonly addressIndex?: number;
	readonly path?: string;
	readonly passphrase?: string;
}

/**
 * Creates an account layer from a BIP-39 mnemonic phrase.
 *
 * @description
 * Derives a private key from the mnemonic using BIP-44 derivation path
 * `m/44'/60'/{account}'/0/{addressIndex}` (default) or a custom `path`
 * and creates a LocalAccount.
 *
 * IMPORTANT: This function requires native FFI and only works in native
 * environments (Node.js/Bun). The WASM bundle does not support HD wallet.
 *
 * @param mnemonic - BIP-39 mnemonic phrase (12-24 words)
 * @param options - Derivation options
 * @param options.account - Account index (default: 0)
 * @param options.index - Address index (default: 0) (legacy alias)
 * @param options.addressIndex - Address index (default: 0)
 * @param options.path - Custom derivation path (overrides account/index)
 * @param options.passphrase - Optional BIP-39 passphrase
 * @returns Layer providing AccountService
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { AccountService } from 'voltaire-effect'
 * import { MnemonicAccount } from 'voltaire-effect/native'
 * import { Secp256k1Live, KeccakLive } from 'voltaire-effect/crypto'
 *
 * const mnemonic = "test test test test test test test test test test test junk";
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   console.log('Address:', account.address)
 *   return account
 * }).pipe(
 *   Effect.provide(MnemonicAccount(mnemonic)),
 *   Effect.provide(Secp256k1Live),
 *   Effect.provide(KeccakLive)
 * )
 * ```
 *
 * @example Multiple accounts from same mnemonic
 * ```typescript
 * // First account (default: m/44'/60'/0'/0/0)
 * const account0 = MnemonicAccount(mnemonic)
 *
 * // Second address in first account (m/44'/60'/0'/0/1)
 * const account0Index1 = MnemonicAccount(mnemonic, { addressIndex: 1 })
 *
 * // Second account (m/44'/60'/1'/0/0)
 * const account1 = MnemonicAccount(mnemonic, { account: 1 })
 * ```
 *
 * @see {@link LocalAccount} - The underlying account implementation
 * @see {@link AccountService} - The service interface
 */
/**
 * Error class for HD wallet derivation failures.
 *
 * @since 0.0.1
 */
export class HDWalletDerivationError extends Error {
	readonly _tag = "HDWalletDerivationError";
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "HDWalletDerivationError";
	}
}

const createHdAccount = (
	hdKey: ExtendedKeyType,
	deps: {
		readonly secp256k1: Secp256k1ServiceShape;
		readonly keccak: KeccakServiceShape;
	},
	HDWallet: HDWalletApi,
) =>
	Effect.gen(function* () {
		const privateKey = yield* Effect.try({
			try: () => HDWallet.getPrivateKey(hdKey),
			catch: (e) =>
				new HDWalletDerivationError("Failed to extract private key", {
					cause: e,
				}),
		});

		if (!privateKey) {
			return yield* Effect.fail(
				new HDWalletDerivationError("Failed to derive private key from HD key"),
			);
		}

		const account = yield* createLocalAccount(
			Hex.fromBytes(privateKey) as HexType,
			deps,
		);

		const extendedPublicKey = yield* Effect.try({
			try: () => HDWallet.toExtendedPublicKey(hdKey),
			catch: (e) =>
				new HDWalletDerivationError("Failed to export extended public key", {
					cause: e,
				}),
		});

		return {
			...account,
			hdKey: extendedPublicKey,
			deriveChild: (index: number) =>
				Effect.gen(function* () {
					const childKey = yield* Effect.try({
						try: () => HDWallet.deriveChild(hdKey, index),
						catch: (e) =>
							new HDWalletDerivationError(
								`Failed to derive child at index ${index}`,
								{ cause: e },
							),
					});
					return yield* createHdAccount(childKey, deps, HDWallet);
				}),
		};
	});

export const MnemonicAccount = (
	mnemonic: string,
	options?: MnemonicAccountOptions,
): Layer.Layer<
	AccountService,
	Error | HDWalletDerivationError,
	Secp256k1Service | KeccakService
> =>
	Layer.scoped(
		AccountService,
		Effect.gen(function* () {
			const secp256k1 = yield* Secp256k1Service;
			const keccak = yield* KeccakService;

			const accountIndex = options?.account ?? 0;
			const addressIndex = options?.addressIndex ?? options?.index ?? 0;
			const passphrase = options?.passphrase ?? "";
			const path =
				options?.path ?? `m/44'/60'/${accountIndex}'/0/${addressIndex}`;

			if (!Bip39.validateMnemonic(mnemonic)) {
				return yield* Effect.fail(new Error("Invalid mnemonic phrase"));
			}

			const seed = yield* Effect.promise(() =>
				Bip39.mnemonicToSeed(mnemonic, passphrase),
			);

			const root = yield* Effect.try({
				try: () => HDWallet.fromSeed(seed),
				catch: (e) =>
					new HDWalletDerivationError("Failed to create root HD wallet", {
						cause: e,
					}),
			});

			const derived = yield* Effect.try({
				try: () => HDWallet.derivePath(root, path),
				catch: (e) =>
					new HDWalletDerivationError(`Failed to derive path ${path}`, {
						cause: e,
					}),
			});

			const account = yield* Effect.acquireRelease(
				createHdAccount(derived, { secp256k1, keccak }, HDWallet),
				(derivedAccount) => derivedAccount.clearKey(),
			);

			return account;
		}),
	);
