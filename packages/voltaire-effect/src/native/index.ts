/**
 * Native-only entrypoint for voltaire-effect.
 *
 * Re-exports the base API and adds native-dependent services.
 */

export * from "../index.js";
export { CryptoLiveNative } from "./CryptoLiveNative.js";
export { HDWalletLive } from "../crypto/HDWallet/HDWalletLive.js";
export {
	HDWalletDerivationError,
	MnemonicAccount,
	type MnemonicAccountOptions,
} from "../services/Account/fromMnemonic.js";
