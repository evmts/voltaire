import { generateMnemonic as generateBip39Mnemonic } from "../Bip39/generateMnemonic.js";
import { InvalidMnemonicError } from "./errors.js";

/**
 * Generate BIP-39 mnemonic words from secure randomness.
 *
 * @param {128 | 256} [strength=128] - Entropy strength in bits
 * @returns {Promise<string[]>} Mnemonic words
 * @throws {InvalidMnemonicError} If strength is invalid or generation fails
 */
export async function generateMnemonic(strength = 128) {
	if (strength !== 128 && strength !== 256) {
		throw new InvalidMnemonicError("Strength must be 128 or 256", {
			code: -32602,
			context: { strength, validValues: [128, 256] },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
		});
	}

	try {
		return generateBip39Mnemonic(strength).split(" ");
	} catch (error) {
		throw new InvalidMnemonicError("Failed to generate mnemonic", {
			code: -32000,
			context: { strength },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
			cause: error instanceof Error ? error : undefined,
		});
	}
}
