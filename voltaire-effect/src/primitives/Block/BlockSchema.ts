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

		const isObject = (value: unknown): value is Record<string, unknown> =>
			typeof value === "object" && value !== null && !Array.isArray(value);

		// Check top-level structure
		if (!("header" in block) || !isObject(block.header)) return false;
		if (!("body" in block) || !isObject(block.body)) return false;
		if (!("hash" in block) || !(block.hash instanceof Uint8Array)) return false;
		if (block.hash.length !== 32) return false;
		if (!("size" in block) || typeof block.size !== "bigint") return false;

		const header = block.header;
		const body = block.body;

		// Validate required header fields (all BlockHeaderType required fields)
		const requiredHeaderFields = [
			"parentHash",
			"ommersHash",
			"beneficiary",
			"stateRoot",
			"transactionsRoot",
			"receiptsRoot",
			"logsBloom",
			"difficulty",
			"number",
			"gasLimit",
			"gasUsed",
			"timestamp",
			"extraData",
			"mixHash",
			"nonce",
		];

		for (const field of requiredHeaderFields) {
			if (!(field in header)) return false;
		}

		// Validate header Uint8Array fields have correct lengths
		if (
			!(header.parentHash instanceof Uint8Array) ||
			header.parentHash.length !== 32
		)
			return false;
		if (
			!(header.ommersHash instanceof Uint8Array) ||
			header.ommersHash.length !== 32
		)
			return false;
		if (
			!(header.beneficiary instanceof Uint8Array) ||
			header.beneficiary.length !== 20
		)
			return false;
		if (
			!(header.stateRoot instanceof Uint8Array) ||
			header.stateRoot.length !== 32
		)
			return false;
		if (
			!(header.transactionsRoot instanceof Uint8Array) ||
			header.transactionsRoot.length !== 32
		)
			return false;
		if (
			!(header.receiptsRoot instanceof Uint8Array) ||
			header.receiptsRoot.length !== 32
		)
			return false;
		if (
			!(header.logsBloom instanceof Uint8Array) ||
			header.logsBloom.length !== 256
		)
			return false;
		if (!(header.mixHash instanceof Uint8Array) || header.mixHash.length !== 32)
			return false;
		if (!(header.nonce instanceof Uint8Array) || header.nonce.length !== 8)
			return false;
		if (!(header.extraData instanceof Uint8Array)) return false;

		// Validate header bigint fields
		if (typeof header.difficulty !== "bigint") return false;
		if (typeof header.number !== "bigint") return false;
		if (typeof header.gasLimit !== "bigint") return false;
		if (typeof header.gasUsed !== "bigint") return false;
		if (typeof header.timestamp !== "bigint") return false;

		// Validate optional header fields if present
		if ("baseFeePerGas" in header && typeof header.baseFeePerGas !== "bigint")
			return false;
		if (
			"withdrawalsRoot" in header &&
			(!(header.withdrawalsRoot instanceof Uint8Array) ||
				header.withdrawalsRoot.length !== 32)
		)
			return false;
		if ("blobGasUsed" in header && typeof header.blobGasUsed !== "bigint")
			return false;
		if ("excessBlobGas" in header && typeof header.excessBlobGas !== "bigint")
			return false;
		if (
			"parentBeaconBlockRoot" in header &&
			(!(header.parentBeaconBlockRoot instanceof Uint8Array) ||
				header.parentBeaconBlockRoot.length !== 32)
		)
			return false;

		// Validate required body fields
		if (!("transactions" in body) || !Array.isArray(body.transactions))
			return false;
		if (!("ommers" in body) || !Array.isArray(body.ommers)) return false;

		// Validate optional withdrawals if present and not undefined (post-Shanghai)
		if (
			"withdrawals" in body &&
			body.withdrawals !== undefined &&
			!Array.isArray(body.withdrawals)
		) {
			return false;
		}

		return true;
	},
);
