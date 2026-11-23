import { generateMnemonic } from "./generateMnemonic.native.js";
import { HDWallet as BaseHDWallet } from "./HDWallet.js";
import { mnemonicToSeed } from "./mnemonicToSeed.native.js";
import { validateMnemonic } from "./validateMnemonic.native.js";

export * from "./HDWallet.js";
export { generateMnemonic, mnemonicToSeed, validateMnemonic };

/** @typedef {import("./HDWallet.js").HDWallet} HDWallet */

/** Keep libwally mnemonic behavior available from the native entry point. */
export const HDWallet = {
	...BaseHDWallet,
	generateMnemonic,
	mnemonicToSeed,
	validateMnemonic,
};
