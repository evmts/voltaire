// @ts-nocheck
/**
 * @typedef {import('node:ffi-napi').Library} Library
 */

import ffi from "node:ffi-napi";
import ref from "ref-napi";
import { LIB_PATH } from "../../lib-path.js";

const voidPtr = ref.refType(ref.types.void);

/**
 * @type {Library}
 */
export const libwally = ffi.Library(LIB_PATH, {
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
