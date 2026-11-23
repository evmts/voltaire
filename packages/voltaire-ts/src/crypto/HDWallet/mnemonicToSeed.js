import { mnemonicToSeed as deriveBip39Seed } from "../Bip39/mnemonicToSeed.js";
import { InvalidMnemonicError } from "./errors.js";

/**
 * Convert a BIP-39 mnemonic to a seed.
 *
 * @param {string | string[]} mnemonic - Mnemonic words or a space-separated sentence
 * @param {string} [password] - Optional passphrase
 * @returns {Promise<Uint8Array>} 512-bit seed
 * @throws {InvalidMnemonicError} If mnemonic conversion fails
 */
export async function mnemonicToSeed(mnemonic, password) {
	const phrase = typeof mnemonic === "string" ? mnemonic : mnemonic.join(" ");
	try {
		return await deriveBip39Seed(phrase, password);
	} catch (error) {
		throw new InvalidMnemonicError("Failed to convert mnemonic to seed", {
			code: -32000,
			docsPath: "/crypto/hdwallet/mnemonic-to-seed#error-handling",
			cause: error instanceof Error ? error : undefined,
		});
	}
}
