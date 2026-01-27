import { InvalidMnemonicError } from "./errors.js";

/**
 * Convert BIP-39 mnemonic to seed
 *
 * @param {string | string[]} mnemonic - Mnemonic words (array or space-separated string)
 * @param {string} [password] - Optional passphrase
 * @returns {Promise<Uint8Array>} 512-bit seed
 * @throws {InvalidMnemonicError} If mnemonic conversion fails
 */
export async function mnemonicToSeed(mnemonic, password) {
	const { getLibwally } = await import("./ffi.js");
	const libwally = await getLibwally();

	const mnemonicStr =
		typeof mnemonic === "string" ? mnemonic : mnemonic.join(" ");
	const seed = new Uint8Array(64);

	const result = libwally.hdwallet_mnemonic_to_seed(
		mnemonicStr,
		password ?? null,
		seed,
	);

	if (result !== 0) {
		throw new InvalidMnemonicError("Failed to convert mnemonic to seed", {
			code: -32000,
			context: { result },
			docsPath: "/crypto/hdwallet/mnemonic-to-seed#error-handling",
		});
	}

	return new Uint8Array(seed);
}
