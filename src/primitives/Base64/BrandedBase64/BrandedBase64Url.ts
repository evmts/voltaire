import type { brand } from "../../../brand.js";

/**
 * Branded Base64Url string type
 *
 * URL-safe Base64 encoding (RFC 4648):
 * - Alphabet: A-Z, a-z, 0-9, -, _
 * - Padding: typically omitted
 *
 * Type safety ensures only validated Base64Url strings are used.
 */
export type BrandedBase64Url = string & {
	readonly [brand]: "Base64Url";
};

/**
 * Inputs that can be converted to BrandedBase64Url
 */
export type Base64UrlLike = BrandedBase64Url | string | Uint8Array;
