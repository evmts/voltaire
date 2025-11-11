import { InvalidMnemonicError } from "./errors.js";

/**
 * Generate BIP-39 mnemonic from entropy
 *
 * @param {128 | 256} [strength=128] - Entropy strength in bits
 * @returns {Promise<string[]>} Mnemonic words
 * @throws {InvalidMnemonicError} If strength is invalid or generation fails
 */
export async function generateMnemonic(strength = 128) {
	if (strength !== 128 && strength !== 256) {
		throw new InvalidMnemonicError("Strength must be 128 or 256", {
			code: "INVALID_MNEMONIC_STRENGTH",
			context: { strength, validValues: [128, 256] },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
		});
	}

	const { libwally } = await import("./ffi.js");
	const crypto = await import("node:crypto");

	const entropyLen = strength / 8;
	const entropy = Buffer.alloc(entropyLen);
	crypto.randomFillSync(entropy);

	const outBuf = Buffer.alloc(256);
	const result = libwally.hdwallet_generate_mnemonic(
		entropy,
		entropyLen,
		outBuf,
		256,
	);

	if (result < 0) {
		throw new InvalidMnemonicError("Failed to generate mnemonic", {
			code: "MNEMONIC_GENERATION_FAILED",
			context: { strength, result },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
		});
	}

	const mnemonicStr = outBuf.toString("utf8", 0, result);
	return mnemonicStr.split(" ");
}
