// @ts-nocheck
/**
 * @typedef {import('ffi-napi').Library} Library
 */

import { LIB_PATH } from "../../lib-path.js";

/** @type {Library | null} */
let cachedLibwally = null;
/** @type {Promise<Library> | null} */
let libwallyPromise = null;

/**
 * Load libwally via ffi-napi/ref-napi only when needed.
 *
 * @returns {Promise<Library>}
 */
export async function getLibwally() {
	if (cachedLibwally) return cachedLibwally;
	if (!libwallyPromise) {
		libwallyPromise = (async () => {
			const [{ default: ffi }, { default: ref }] = await Promise.all([
				import("ffi-napi"),
				import("ref-napi"),
			]);

			ref.refType(ref.types.void);

			return ffi.Library(LIB_PATH, {
				hdwallet_generate_mnemonic: [
					"int",
					["pointer", "size_t", "pointer", "size_t"],
				],
				hdwallet_mnemonic_to_seed: ["int", ["string", "string", "pointer"]],
				hdwallet_validate_mnemonic: ["int", ["string"]],
				hdwallet_from_seed: ["size_t", ["pointer", "size_t"]],
				hdwallet_derive: ["size_t", ["size_t", "pointer", "size_t"]],
				hdwallet_get_private_key: ["int", ["size_t", "pointer"]],
				hdwallet_get_public_key: ["int", ["size_t", "pointer"]],
				hdwallet_get_address: ["int", ["size_t", "pointer"]],
				hdwallet_free: ["int", ["size_t"]],
			});
		})();
	}

	cachedLibwally = await libwallyPromise;
	return cachedLibwally;
}
