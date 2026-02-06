export type { Base64Like, Base64UrlLike, BrandedBase64, BrandedBase64Url, } from "./Base64Type.js";
import type { BrandedBase64, BrandedBase64Url } from "./Base64Type.js";
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
//# sourceMappingURL=types.d.ts.map