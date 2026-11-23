import { validateMnemonic as validateBip39Mnemonic } from "../Bip39/validateMnemonic.js";

/**
 * Validate a BIP-39 mnemonic checksum.
 *
 * @param {string | string[]} mnemonic - Mnemonic words or a space-separated sentence
 * @returns {Promise<boolean>} True if valid
 */
export async function validateMnemonic(mnemonic) {
	const phrase = typeof mnemonic === "string" ? mnemonic : mnemonic.join(" ");
	return validateBip39Mnemonic(phrase);
}
