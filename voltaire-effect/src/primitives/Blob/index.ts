/**
 * Blob module for EIP-4844 blob data.
 * Provides Effect-based schemas and functions for 128KB blob handling.
 * 
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 * 
 * const blob = await Effect.runPromise(Blob.fromData(data))
 * const retrieved = Blob.toData(blob)
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlobSchema, BlobSchema as Schema } from './BlobSchema.js'
export { from } from './from.js'
export { fromData } from './fromData.js'
export { toData } from './toData.js'
export { isValid } from './isValid.js'

export { SIZE, FIELD_ELEMENTS_PER_BLOB, BYTES_PER_FIELD_ELEMENT, MAX_PER_TRANSACTION } from '@tevm/voltaire/Blob'
