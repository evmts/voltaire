import type { brand } from "../../../brand.js";

/**
 * Branded Base64 string type
 *
 * Standard Base64 encoding (RFC 4648):
 * - Alphabet: A-Z, a-z, 0-9, +, /
 * - Padding: = (required, length must be multiple of 4)
 *
 * Type safety ensures only validated Base64 strings are used.
 */
export type BrandedBase64 = string & {
	readonly [brand]: "Base64";
};

/**
 * Inputs that can be converted to BrandedBase64
 */
export type Base64Like = BrandedBase64 | string | Uint8Array;
