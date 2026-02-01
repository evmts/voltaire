// @ts-nocheck
import { COMPRESSED_PUBLIC_KEY_SIZE } from "./constants.js";
import { InvalidAnnouncementError } from "./errors.js";

/**
 * Parse stealth address announcement
 *
 * Extracts ephemeral public key (33 bytes) and view tag (1 byte)
 * from announcement data.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#announcement-format
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} announcement - Announcement bytes (ephemeralPubKey + viewTag)
 * @returns {{ ephemeralPublicKey: import('./StealthAddressType.js').EphemeralPublicKey, viewTag: import('./StealthAddressType.js').ViewTag }} Parsed announcement
 * @throws {InvalidAnnouncementError} If announcement length is invalid
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * const announcement = new Uint8Array(34); // 33 + 1
 * const { ephemeralPublicKey, viewTag } = StealthAddress.parseAnnouncement(announcement);
 * console.log(ephemeralPublicKey.length); // 33
 * console.log(typeof viewTag); // 'number'
 * ```
 */
export function parseAnnouncement(announcement) {
	const expectedLength = COMPRESSED_PUBLIC_KEY_SIZE + 1;
	if (announcement.length !== expectedLength) {
		throw new InvalidAnnouncementError(
			`Announcement must be ${expectedLength} bytes, got ${announcement.length}`,
			{
				code: "INVALID_ANNOUNCEMENT_LENGTH",
				context: { actualLength: announcement.length, expectedLength },
			},
		);
	}

	const ephemeralPublicKey =
		/** @type {import('./StealthAddressType.js').EphemeralPublicKey} */ (
			announcement.slice(0, COMPRESSED_PUBLIC_KEY_SIZE)
		);
	const viewTag = /** @type {import('./StealthAddressType.js').ViewTag} */ (
		announcement[COMPRESSED_PUBLIC_KEY_SIZE]
	);

	return { ephemeralPublicKey, viewTag };
}
