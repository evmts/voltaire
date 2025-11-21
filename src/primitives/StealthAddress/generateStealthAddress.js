// @ts-nocheck
import * as Secp256k1 from "../../crypto/Secp256k1/index.js";
import * as Keccak256 from "../../crypto/Keccak256/index.js";
import * as BrandedAddress from "../Address/internal-index.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";
import { compressPublicKey } from "./compressPublicKey.js";
import { computeViewTag } from "./computeViewTag.js";
import { decompressPublicKey } from "./decompressPublicKey.js";
import { parseMetaAddress } from "./parseMetaAddress.js";
import { StealthAddressGenerationError } from "./errors.js";

/**
 * Generate stealth address from meta-address
 *
 * Implements ERC-5564 stealth address generation:
 * 1. Parse meta-address → spending + viewing public keys
 * 2. Compute shared secret: ECDH(ephemeralPrivKey, viewingPubKey)
 * 3. Hash shared secret: keccak256(sharedSecret)
 * 4. Derive view tag: first byte of hash
 * 5. Compute stealth pubkey: spendingPubKey + hash * G
 * 6. Derive stealth address from pubkey
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-address-generation
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {import('./StealthAddressType.js').StealthMetaAddress} metaAddress - 66-byte stealth meta-address
 * @param {Uint8Array} ephemeralPrivateKey - 32-byte ephemeral private key
 * @returns {import('./StealthAddressType.js').GenerateStealthAddressResult} Stealth address, ephemeral pubkey, view tag
 * @throws {StealthAddressGenerationError} If generation fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 *
 * // Recipient publishes meta-address
 * const metaAddress = StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey);
 *
 * // Sender generates stealth address
 * const ephemeralPrivKey = new Uint8Array(32);
 * crypto.getRandomValues(ephemeralPrivKey);
 * const result = StealthAddress.generateStealthAddress(metaAddress, ephemeralPrivKey);
 *
 * console.log(result.stealthAddress); // 20-byte address
 * console.log(result.ephemeralPublicKey); // 33-byte compressed pubkey
 * console.log(result.viewTag); // 0-255
 * ```
 */
export function generateStealthAddress(metaAddress, ephemeralPrivateKey) {
	if (ephemeralPrivateKey.length !== PRIVATE_KEY_SIZE) {
		throw new StealthAddressGenerationError(
			`Ephemeral private key must be ${PRIVATE_KEY_SIZE} bytes, got ${ephemeralPrivateKey.length}`,
			{
				code: "INVALID_EPHEMERAL_PRIVATE_KEY_LENGTH",
				context: { actualLength: ephemeralPrivateKey.length },
			},
		);
	}

	try {
		// 1. Parse meta-address
		const { spendingPubKey, viewingPubKey } = parseMetaAddress(metaAddress);

		// 2. Derive ephemeral public key
		const ephemeralPublicKeyUncompressed =
			Secp256k1.derivePublicKey(ephemeralPrivateKey);
		const ephemeralPublicKey =
			/** @type {import('./StealthAddressType.js').EphemeralPublicKey} */ (
				compressPublicKey(ephemeralPublicKeyUncompressed)
			);

		// 3. Decompress viewing public key for ECDH
		const viewingPubKeyUncompressed = decompressPublicKey(viewingPubKey);

		// 4. Compute shared secret: ECDH(ephemeralPrivKey, viewingPubKey)
		const sharedSecret = Secp256k1.ecdh(
			ephemeralPrivateKey,
			viewingPubKeyUncompressed,
		);

		// 5. Hash shared secret
		const hashedSecret = Keccak256.hash(sharedSecret);

		// 6. Compute view tag
		const viewTag = computeViewTag(hashedSecret);

		// 7. Compute stealth point: hashedSecret * G
		const stealthPoint = Secp256k1.scalarMultiply(hashedSecret);

		// 8. Decompress spending public key for point addition
		const spendingPubKeyUncompressed = decompressPublicKey(spendingPubKey);

		// 9. Compute stealth public key: spendingPubKey + stealthPoint
		const stealthPubKey = Secp256k1.addPoints(
			spendingPubKeyUncompressed,
			stealthPoint,
		);

		// 10. Derive address from stealth public key
		// Split into x and y coordinates
		const x = stealthPubKey.slice(0, 32);
		const y = stealthPubKey.slice(32, 64);

		// Convert to bigint
		let xBigInt = 0n;
		for (let i = 0; i < 32; i++) {
			xBigInt = (xBigInt << 8n) | BigInt(x[i]);
		}
		let yBigInt = 0n;
		for (let i = 0; i < 32; i++) {
			yBigInt = (yBigInt << 8n) | BigInt(y[i]);
		}

		const stealthAddress = BrandedAddress.fromPublicKey(xBigInt, yBigInt);

		return {
			stealthAddress,
			ephemeralPublicKey,
			viewTag,
		};
	} catch (error) {
		throw new StealthAddressGenerationError(
			`Stealth address generation failed: ${error}`,
			{
				code: "GENERATION_FAILED",
				cause: error,
			},
		);
	}
}
