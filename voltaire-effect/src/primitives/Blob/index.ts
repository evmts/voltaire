/**
 * @fileoverview Blob module for EIP-4844 blob data.
 *
 * EIP-4844 introduces "blobs" - large data structures (128KB each) that can be
 * attached to transactions for data availability. Blobs are used for Layer 2
 * rollup data and are significantly cheaper than calldata.
 *
 * This module provides Effect-based schemas and functions for creating,
 * validating, and working with blob data.
 *
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a blob from arbitrary data (will be padded)
 * const blob = await Effect.runPromise(Blob.fromData(data))
 *
 * // Extract the original data
 * const retrieved = Blob.toData(blob)
 *
 * // Check if data is valid blob size
 * if (Blob.isValid(data)) {
 *   const exactBlob = await Effect.runPromise(Blob.from(data))
 * }
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @module Blob
 * @since 0.0.1
 */

/**
 * Blob constants from EIP-4844
 * - SIZE: 131,072 bytes (128KB)
 * - FIELD_ELEMENTS_PER_BLOB: 4,096
 * - BYTES_PER_FIELD_ELEMENT: 32
 * - MAX_PER_TRANSACTION: 6
 */
export {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
} from "@tevm/voltaire/Blob";
/** Schema for blob validation */
export { BlobSchema, BlobSchema as Schema } from "./BlobSchema.js";
/** Create blob from exact 131,072 bytes */
/** Create blob from arbitrary data with padding */

/** Check if data is valid blob size */
export { isValid } from "./isValid.js";
/** Extract original data from blob */
export { toData } from "./toData.js";
