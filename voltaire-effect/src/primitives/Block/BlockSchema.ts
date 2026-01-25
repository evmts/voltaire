/**
 * @fileoverview Effect Schema for Ethereum block validation.
 * Provides type-safe validation for complete block structures.
 *
 * @module Block/BlockSchema
 * @since 0.0.1
 */

import type { Block } from "@tevm/voltaire";
import * as Schema from "effect/Schema";

/**
 * Type alias for the branded Block type.
 * @internal
 */
type BlockType = Block.BlockType;

/**
 * Effect Schema for validating complete Ethereum blocks.
 *
 * @description
 * Validates that an input conforms to the complete Ethereum block structure.
 * A valid block must contain:
 * - `header`: Block header with number, parent hash, state root, etc.
 * - `body`: Block body containing transactions and uncle headers
 * - `hash`: Block hash as 32-byte Uint8Array
 * - `size`: Block size as bigint
 *
 * This schema uses runtime type checking to validate block structure.
 * It does not perform deep validation of header or body contents.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { BlockSchema } from 'voltaire-effect/primitives/Block'
 * import * as Schema from 'effect/Schema'
 *
 * // Validate block data
 * const block = Schema.decodeSync(BlockSchema)(blockData)
 * console.log(block.header)  // Block header
 * console.log(block.body)    // Block body with transactions
 * console.log(block.hash)    // 32-byte block hash
 * console.log(block.size)    // Block size in bytes
 * ```
 *
 * @example
 * ```typescript
 * // Check if data is a valid block
 * const isBlock = Schema.is(BlockSchema)
 * if (isBlock(unknownData)) {
 *   console.log('Valid block:', unknownData.header.number)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use with Effect for error handling
 * import * as Effect from 'effect/Effect'
 *
 * const result = await Effect.runPromise(
 *   Schema.decodeUnknown(BlockSchema)(rpcResponse).pipe(
 *     Effect.map((block) => ({
 *       number: block.header.number,
 *       hash: block.hash
 *     }))
 *   )
 * )
 * ```
 *
 * @throws {ParseError} When input does not match the expected block structure.
 *
 * @see {@link Block} from voltaire for the underlying block type
 */
export const BlockSchema: Schema.Schema<BlockType> = Schema.declare(
	(input: unknown): input is BlockType => {
		if (typeof input !== "object" || input === null) return false;
		const block = input as Record<string, unknown>;
		return (
			"header" in block &&
			"body" in block &&
			"hash" in block &&
			block.hash instanceof Uint8Array &&
			"size" in block &&
			typeof block.size === "bigint"
		);
	},
);
