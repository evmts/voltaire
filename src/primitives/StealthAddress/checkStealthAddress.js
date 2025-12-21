import * as Keccak256 from "../../crypto/Keccak256/index.js";
// @ts-nocheck
import * as Secp256k1 from "../../crypto/Secp256k1/index.js";
import * as BrandedAddress from "../Address/internal-index.js";
import { computeViewTag } from "./computeViewTag.js";
import { COMPRESSED_PUBLIC_KEY_SIZE, PRIVATE_KEY_SIZE } from "./constants.js";
import { decompressPublicKey } from "./decompressPublicKey.js";
import { StealthAddressError } from "./errors.js";

/**
 * Check if stealth address belongs to recipient
 *
 * Implements ERC-5564 stealth address checking:
 * 1. Compute shared secret: ECDH(viewingPrivKey, ephemeralPubKey)
 * 2. Hash shared secret
 * 3. Check view tag matches (fast rejection)
 * 4. If matches, compute stealth private key
 * 5. Derive address and verify match
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-address-checking
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} viewingPrivateKey - 32-byte viewing private key
 * @param {import('./StealthAddressType.js').EphemeralPublicKey} ephemeralPublicKey - 33-byte compressed ephemeral public key
 * @param {import('./StealthAddressType.js').ViewTag} viewTag - View tag from announcement
 * @param {import('./StealthAddressType.js').SpendingPublicKey} spendingPublicKey - 33-byte compressed spending public key
 * @param {import('../Address/AddressType.js').AddressType} stealthAddress - Announced stealth address
 * @returns {import('./StealthAddressType.js').CheckStealthAddressResult} Match result with optional stealth private key
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 *
 * // Recipient scans announcements
 * const result = StealthAddress.checkStealthAddress(
 *   viewingPrivateKey,
 *   announcement.ephemeralPublicKey,
 *   announcement.viewTag,
 *   spendingPublicKey,
 *   announcement.stealthAddress
 * );
 *
 * if (result.isForRecipient) {
 *   console.log('Found stealth payment!');
 *   // Use result.stealthPrivateKey to spend
 * }
 * ```
 */
export function checkStealthAddress(
	viewingPrivateKey,
	ephemeralPublicKey,
	viewTag,
	spendingPublicKey,
	stealthAddress,
) {
	if (viewingPrivateKey.length !== PRIVATE_KEY_SIZE) {
		throw new StealthAddressError(
			`Viewing private key must be ${PRIVATE_KEY_SIZE} bytes, got ${viewingPrivateKey.length}`,
			{
				code: "INVALID_VIEWING_PRIVATE_KEY_LENGTH",
				context: { actualLength: viewingPrivateKey.length },
			},
		);
	}

	if (ephemeralPublicKey.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
		throw new StealthAddressError(
			`Ephemeral public key must be ${COMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${ephemeralPublicKey.length}`,
			{
				code: "INVALID_EPHEMERAL_PUBLIC_KEY_LENGTH",
				context: { actualLength: ephemeralPublicKey.length },
			},
		);
	}

	if (spendingPublicKey.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
		throw new StealthAddressError(
			`Spending public key must be ${COMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${spendingPublicKey.length}`,
			{
				code: "INVALID_SPENDING_PUBLIC_KEY_LENGTH",
				context: { actualLength: spendingPublicKey.length },
			},
		);
	}

	try {
		// 1. Decompress ephemeral public key for ECDH
		const ephemeralPubKeyUncompressed = decompressPublicKey(ephemeralPublicKey);

		// 2. Compute shared secret: ECDH(viewingPrivKey, ephemeralPubKey)
		const sharedSecret = Secp256k1.ecdh(
			/** @type {*} */ (viewingPrivateKey),
			/** @type {*} */ (ephemeralPubKeyUncompressed),
		);

		// 3. Hash shared secret
		const hashedSecret = Keccak256.hash(sharedSecret);

		// 4. Check view tag for fast rejection
		const computedViewTag = computeViewTag(hashedSecret);
		if (computedViewTag !== viewTag) {
			// Not for this recipient (255/256 probability)
			return { isForRecipient: false };
		}

		// 5. View tag matches, compute stealth point: hashedSecret * G
		const stealthPoint = Secp256k1.scalarMultiply(hashedSecret);

		// 6. Decompress spending public key
		const spendingPubKeyUncompressed = decompressPublicKey(spendingPublicKey);

		// 7. Compute stealth public key: spendingPubKey + stealthPoint
		const stealthPubKey = Secp256k1.addPoints(
			/** @type {*} */ (spendingPubKeyUncompressed),
			stealthPoint,
		);

		// 8. Derive address from stealth public key
		const x = stealthPubKey.slice(0, 32);
		const y = stealthPubKey.slice(32, 64);

		let xBigInt = 0n;
		for (let i = 0; i < 32; i++) {
			xBigInt = (xBigInt << 8n) | BigInt(/** @type {number} */ (x[i]));
		}
		let yBigInt = 0n;
		for (let i = 0; i < 32; i++) {
			yBigInt = (yBigInt << 8n) | BigInt(/** @type {number} */ (y[i]));
		}

		const computedStealthAddress = BrandedAddress.fromPublicKey(
			xBigInt,
			yBigInt,
		);

		// 9. Check if addresses match
		const addressesMatch = BrandedAddress.equals(
			computedStealthAddress,
			stealthAddress,
		);

		if (!addressesMatch) {
			return { isForRecipient: false };
		}

		// 10. Compute stealth private key: spendingPrivKey + hashedSecret (mod n)
		// This requires spending private key as input
		// For now, just return the hashedSecret which can be used with spending key
		// Full implementation: stealthPrivKey = (spendingPrivKey + hashedSecret) mod n

		return {
			isForRecipient: true,
			stealthPrivateKey: hashedSecret, // This is the offset, not the full key
		};
	} catch (error) {
		throw new StealthAddressError(`Stealth address checking failed: ${error}`, {
			code: "CHECK_FAILED",
			cause: error,
		});
	}
}
