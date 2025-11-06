/**
 * Validate BIP-39 mnemonic checksum
 *
 * @param {string | string[]} mnemonic - Mnemonic words (array or space-separated string)
 * @returns {boolean} True if valid
 */
export async function validateMnemonic(mnemonic) {
	const { libwally } = await import("./ffi.js");

	const mnemonicStr =
		typeof mnemonic === "string" ? mnemonic : mnemonic.join(" ");

	const result = libwally.hdwallet_validate_mnemonic(mnemonicStr);
	return result === 1;
}
