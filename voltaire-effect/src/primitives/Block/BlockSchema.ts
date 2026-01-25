import { Block } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'

type BlockType = Block.BlockType

/**
 * Effect Schema for validating complete Ethereum blocks.
 * Validates block structure including header, body, hash, and size.
 * 
 * @example
 * ```typescript
 * import { BlockSchema } from 'voltaire-effect/primitives/Block'
 * import * as Schema from 'effect/Schema'
 * 
 * const block = Schema.decodeSync(BlockSchema)(blockData)
 * ```
 * 
 * @since 0.0.1
 */
export const BlockSchema: Schema.Schema<BlockType> = Schema.declare(
  (input: unknown): input is BlockType => {
    if (typeof input !== 'object' || input === null) return false
    const block = input as Record<string, unknown>
    return (
      'header' in block &&
      'body' in block &&
      'hash' in block &&
      block.hash instanceof Uint8Array &&
      'size' in block &&
      typeof block.size === 'bigint'
    )
  }
)
