/**
 * Base64 module for encoding and decoding base64 data.
 * Provides Effect-based schemas for standard and URL-safe base64.
 *
 * @example
 * ```typescript
 * import * as Base64 from 'voltaire-effect/primitives/Base64'
 * import * as Schema from 'effect/Schema'
 *
 * const encoded = Schema.decodeSync(Base64.Schema)('SGVsbG8gV29ybGQ=')
 * ```
 *
 * @since 0.0.1
 * @module
 */

export type { BrandedBase64, BrandedBase64Url } from "@tevm/voltaire/Base64";
export { Schema, UrlSchema } from "./Base64Schema.js";
