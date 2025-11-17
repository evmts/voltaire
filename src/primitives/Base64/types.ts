export type { BrandedBase64 } from "./Base64Type.js";
export type { BrandedBase64Url } from "./Base64Type.js";
export type { Base64Like } from "./Base64Type.js";
export type { Base64UrlLike } from "./Base64Type.js";

/**
 * @deprecated Use BrandedBase64 instead
 * Base64-encoded string (standard alphabet)
 */
export type Base64String = BrandedBase64 | string;

/**
 * @deprecated Use BrandedBase64Url instead
 * URL-safe base64-encoded string (no padding, - and _ instead of + and /)
 */
export type Base64UrlString = BrandedBase64Url | string;
