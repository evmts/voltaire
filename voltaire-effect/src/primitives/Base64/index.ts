/**
 * @module Base64
 * @description Effect-based schemas and functions for standard and URL-safe base64 encoding.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Base64 from 'voltaire-effect/primitives/Base64'
 *
 * function decodeBase64(encoded: Base64.BrandedBase64) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Base64.Schema` | string \| Uint8Array | BrandedBase64 |
 * | `Base64.UrlSchema` | string \| Uint8Array | BrandedBase64Url |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Base64.from(value)        // Effect<BrandedBase64, Error>
 * Base64.fromUrlSafe(value) // Effect<BrandedBase64Url, Error>
 * ```
 *
 * ## Encoding (Pure)
 *
 * ```typescript
 * Base64.encode(bytes)           // BrandedBase64
 * Base64.encodeString(str)       // BrandedBase64
 * Base64.encodeUrlSafe(bytes)    // BrandedBase64Url
 * Base64.encodeStringUrlSafe(str) // BrandedBase64Url
 * ```
 *
 * ## Decoding (Effect-wrapped)
 *
 * ```typescript
 * Base64.decode(encoded)           // Effect<Uint8Array, Error>
 * Base64.decodeToString(encoded)   // Effect<string, Error>
 * Base64.decodeUrlSafe(encoded)    // Effect<Uint8Array, Error>
 * Base64.decodeUrlSafeToString(encoded) // Effect<string, Error>
 * ```
 *
 * ## Conversion (Pure)
 *
 * ```typescript
 * Base64.toBytes(b64)        // Uint8Array
 * Base64.toBytesUrlSafe(b64) // Uint8Array
 * Base64.toString(b64)       // string
 * Base64.toStringUrlSafe(b64) // string
 * Base64.toBase64(bytes)     // BrandedBase64
 * Base64.toBase64Url(bytes)  // BrandedBase64Url
 * ```
 *
 * ## Validation (Pure)
 *
 * ```typescript
 * Base64.isValid(str)        // boolean
 * Base64.isValidUrlSafe(str) // boolean
 * ```
 *
 * ## Size Calculation (Pure)
 *
 * ```typescript
 * Base64.calcEncodedSize(byteCount) // number
 * Base64.calcDecodedSize(encoded)   // number
 * ```
 *
 * @example
 * ```typescript
 * import * as Base64 from 'voltaire-effect/primitives/Base64'
 * import * as Schema from 'effect/Schema'
 * import { Effect } from 'effect'
 *
 * const encoded = Schema.decodeSync(Base64.Schema)('SGVsbG8gV29ybGQ=')
 * const decoded = await Effect.runPromise(Base64.decode('SGVsbG8='))
 * ```
 *
 * @since 0.0.1
 * @module
 */

// Types
export type { BrandedBase64, BrandedBase64Url } from "@tevm/voltaire/Base64";

// Schemas
export { Schema, UrlSchema } from "./Base64Schema.js";

// Constructors (Effect-wrapped)
export { from, fromUrlSafe } from "./from.js";

// Encoding (Pure)
export { encode, encodeString, encodeUrlSafe, encodeStringUrlSafe } from "./encode.js";

// Decoding (Effect-wrapped)
export { decode, decodeToString, decodeUrlSafe, decodeUrlSafeToString } from "./decode.js";

// Conversion (Pure)
export { toBytes, toBytesUrlSafe, toString, toStringUrlSafe, toBase64, toBase64Url } from "./convert.js";

// Validation (Pure)
export { isValid, isValidUrlSafe } from "./validation.js";

// Size Calculation (Pure)
export { calcEncodedSize, calcDecodedSize } from "./size.js";
