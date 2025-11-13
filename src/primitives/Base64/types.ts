export type { BrandedBase64 } from "./BrandedBase64/BrandedBase64.js";
export type { BrandedBase64Url } from "./BrandedBase64/BrandedBase64Url.js";
export type { Base64Like } from "./BrandedBase64/BrandedBase64.js";
export type { Base64UrlLike } from "./BrandedBase64/BrandedBase64Url.js";

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
