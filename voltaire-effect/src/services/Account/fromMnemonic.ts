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

import {
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Bip39 from "@tevm/voltaire/Bip39";
import { HDWallet } from "@tevm/voltaire/HDWallet";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { KeccakService } from "../../crypto/Keccak256/index.js";
import { Secp256k1Service } from "../../crypto/Secp256k1/index.js";
import { AccountService } from "./AccountService.js";
import { LocalAccount } from "./LocalAccount.js";

type HexType = BrandedHex.HexType;

export interface MnemonicAccountOptions {
	readonly account?: number;
	readonly index?: number;
	readonly passphrase?: string;
}

/**
 * Creates an account layer from a BIP-39 mnemonic phrase.
 *
 * @description
 * Derives a private key from the mnemonic using BIP-44 derivation path
 * `m/44'/60'/{account}'/0/{index}` and creates a LocalAccount.
 *
 * IMPORTANT: This function requires native FFI and only works in native
 * environments (Node.js/Bun). The WASM bundle does not support HD wallet.
 *
 * @param mnemonic - BIP-39 mnemonic phrase (12-24 words)
 * @param options - Derivation options
 * @param options.account - Account index (default: 0)
 * @param options.index - Address index (default: 0)
 * @param options.passphrase - Optional BIP-39 passphrase
 * @returns Layer providing AccountService
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { AccountService, MnemonicAccount } from 'voltaire-effect/services'
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
 * const account0Index1 = MnemonicAccount(mnemonic, { index: 1 })
 *
 * // Second account (m/44'/60'/1'/0/0)
 * const account1 = MnemonicAccount(mnemonic, { account: 1 })
 * ```
 *
 * @see {@link LocalAccount} - The underlying account implementation
 * @see {@link AccountService} - The service interface
 */
export const MnemonicAccount = (
	mnemonic: string,
	options?: MnemonicAccountOptions,
): Layer.Layer<AccountService, Error, Secp256k1Service | KeccakService> =>
	Layer.unwrapEffect(
		Effect.gen(function* () {
			const accountIndex = options?.account ?? 0;
			const addressIndex = options?.index ?? 0;
			const passphrase = options?.passphrase ?? "";

			if (!Bip39.validateMnemonic(mnemonic)) {
				return yield* Effect.fail(new Error("Invalid mnemonic phrase"));
			}

			const seed = yield* Effect.promise(() =>
				Bip39.mnemonicToSeed(mnemonic, passphrase),
			);

			const root = HDWallet.fromSeed(seed);
			const derived = HDWallet.deriveEthereum(root, accountIndex, addressIndex);
			const privateKey = HDWallet.getPrivateKey(derived);

			if (!privateKey) {
				return yield* Effect.fail(
					new Error("Failed to derive private key from mnemonic"),
				);
			}

			const privateKeyHex = Hex.fromBytes(privateKey) as HexType;
			return LocalAccount(privateKeyHex);
		}),
	);
