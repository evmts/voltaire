/**
 * @fileoverview Shared schema declaration for BlockHashType.
 * @module BlockHash/BlockHashTypeSchema
 * @since 0.1.0
 */

import { BlockHash } from "@tevm/voltaire";
import * as S from "effect/Schema";

type BlockHashType = BlockHash.BlockHashType;

/**
 * Canonical schema declaration for BlockHashType.
 * Validates that a value is a 32-byte Uint8Array.
 *
 * @since 0.1.0
 */
export const BlockHashTypeSchema = S.declare<BlockHashType>(
	(u): u is BlockHashType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "BlockHash" },
);
